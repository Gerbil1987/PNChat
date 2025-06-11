using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using PNChatServer.Data;
using PNChatServer.Dto;
using PNChatServer.Hubs;
using PNChatServer.Models;
using PNChatServer.Repository;
using PNChatServer.Utils;
using RestSharp;

namespace PNChatServer.Service
{
    public class CallService : ICallService
    {
        protected readonly DbChatContext chatContext;
        protected readonly IWebHostEnvironment webHostEnvironment;
        private IHubContext<ChatHub> chatHub;
        private static readonly IDictionary<string, object> _configProperties = new Dictionary<string, object>()
        {
            { "properties",
                new {
                    enable_chat = true,
                    enable_advanced_chat = true,
                    enable_hand_raising = true,
                    enable_emoji_reactions = true,
                    enable_noise_cancellation_ui = true,
                    start_video_off = true,
                    start_audio_off = true,
                }
            }
        };
        public CallService(DbChatContext chatContext, IWebHostEnvironment webHostEnvironment, IHubContext<ChatHub> chatHub)
        {
            this.chatContext = chatContext;
            this.webHostEnvironment = webHostEnvironment;
            this.chatHub = chatHub;
        }

        public async Task<List<GroupCallDto>> GetCallHistory(string userSession)
        {
            List<GroupCallDto> groupCalls = await chatContext.GroupCalls
                     .Where(x => x.Calls.Any(y => y.UserCode.Equals(userSession)))
                     .Select(x => new GroupCallDto()
                     {
                         Code = x.Code,
                         Name = x.Name,
                         Avatar = x.Avatar,
                         LastActive = x.LastActive,
                         Calls = x.Calls.OrderByDescending(y => y.Created)
                             .Select(y => new CallDto()
                             {
                                 UserCode = y.UserCode,
                                 User = new UserDto()
                                 {
                                     FullName = y.User.FullName,
                                     Avatar = y.User.Avatar
                                 },
                                 Created = y.Created,
                                 Status = y.Status
                             }).ToList()
                     }).ToListAsync();
            groupCalls.ForEach(grpCall =>
            {
                var us = grpCall.Calls.FirstOrDefault(x => !x.UserCode.Equals(userSession));
                grpCall.Name = us?.User.FullName;
                grpCall.Avatar = us?.User.Avatar;

                grpCall.LastCall = grpCall.Calls.FirstOrDefault();
            });

            return groupCalls.OrderByDescending(x => x.LastActive).ToList();
        }


        public async Task<List<CallDto>> GetHistoryById(string userSession, string groupCallCode)
        {
            string friend = await chatContext.Calls
                .Where(x => x.GroupCallCode.Equals(groupCallCode) && x.UserCode != userSession)
                .Select(x => x.UserCode)
                .FirstOrDefaultAsync();

            return await chatContext.Calls
                .Where(x => x.UserCode.Equals(userSession) && x.GroupCallCode.Equals(groupCallCode))
                .OrderByDescending(x => x.Created)
                .Select(x => new CallDto()
                {
                    Status = x.Status,
                    Created = x.Created,
                    UserCode = friend
                })
                .ToListAsync();
        }

        public async Task<string> Call(string userSession, string callTo)
        {
            #region Gọi API tạo room - daily.co
            //var e = "{ properties: { enable_chat: true } }";
            //var d = new Dictionary<string, object>() {
            //    { "properties", new { enable_chat = true, enable_hand_raising = true } }
            //};
            var url = "https://api.daily.co/";  
            var client = new RestClient(url);
           
            var request = new RestRequest("v1/rooms", Method.Post);
            
            request.AddHeader("Authorization", $"Bearer {EnviConfig.DailyToken}");
            request.AddJsonBody(_configProperties);

            RestResponse response = await client.ExecutePostAsync(request);
            DailyResponse dailyRoomResp = JsonConvert.DeserializeObject<DailyResponse>(response.Content);
            #endregion

            string grpCallCode = await chatContext.GroupCalls
                       .Where(x => x.Type.Equals(Constants.GroupType.SINGLE))
                       .Where(x => x.Calls.Any(y => y.UserCode.Equals(userSession) &&
                                   x.Calls.Any(y => y.UserCode.Equals(callTo))))
                       .Select(x => x.Code)
                       .FirstOrDefaultAsync();

            GroupCall groupCall = await chatContext.GroupCalls.FirstOrDefaultAsync(x => x.Code.Equals(grpCallCode));
            DateTime dateNow = DateTime.Now;

            User userCallTo = await chatContext.Users.FirstOrDefaultAsync(x => x.Code.Equals(callTo));

            if (groupCall == null)
            {
                groupCall = new GroupCall()
                {
                    Code = Guid.NewGuid().ToString("N"),
                    Created = dateNow,
                    CreatedBy = userSession,
                    Type = Constants.GroupType.SINGLE,
                    LastActive = dateNow
                };
                await chatContext.GroupCalls.AddAsync(groupCall);
            }

            List<Call> calls = new List<Call>(){
                new Call()
                {
                    GroupCallCode = groupCall.Code,
                    UserCode = userSession,
                    Status =Constants.CallStatus.OUT_GOING,
                    Created = dateNow,
                    Url =dailyRoomResp.url,
                },
                new Call()
                {
                    GroupCallCode = groupCall.Code,
                    UserCode = userCallTo.Code,
                    Status =Constants.CallStatus.MISSED,
                    Created = dateNow,
                    Url = dailyRoomResp.url,
                }
            };

            await chatContext.Calls.AddRangeAsync(calls);
            await chatContext.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(userCallTo.CurrentSession))
                await chatHub.Clients.Client(userCallTo.CurrentSession).SendAsync("callHubListener", dailyRoomResp.url);

            return dailyRoomResp.url;
        }


        public async Task JoinVideoCall(string userSession, string url)
        {
            Call call = await chatContext.Calls
                .Where(x => x.UserCode.Equals(userSession) && x.Url.Equals(url))
                .FirstOrDefaultAsync();

            if (call != null)
            {
                call.Status = Constants.CallStatus.IN_COMMING;
                await chatContext.SaveChangesAsync();
            }
        }

        public async Task CancelVideoCall(string userSession, string url)
        {
            string urlCall = await chatContext.Calls
                .Where(x => x.UserCode.Equals(userSession) && x.Url.Equals(url))
                .Select(x => x.Url)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(urlCall))
            {
                try
                {
                    #region gọi API xóa đường dẫn video call trên daily
                    var urlDelete = "https://api.daily.co/";
                    var client = new RestClient(urlDelete);

                    var request = new RestRequest($"v1/rooms/{urlCall.Split('/').Last()}", Method.Delete);
                    request.AddHeader("Authorization", $"Bearer {EnviConfig.DailyToken}");
                    RestResponse response = await client.ExecuteAsync(request);
                    #endregion
                }
                catch (Exception ex) { }
            }
        }
    }
}
