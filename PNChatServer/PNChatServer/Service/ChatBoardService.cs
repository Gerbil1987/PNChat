using Azure.Storage.Blobs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Logging;
using PNChatServer.Data;
using PNChatServer.Dto;
using PNChatServer.Hubs;
using PNChatServer.Models;
using PNChatServer.Repository;
using PNChatServer.Utils;
using System.Reflection.Metadata;
using System.Runtime.ExceptionServices;
using static System.Reflection.Metadata.BlobBuilder;

namespace PNChatServer.Service
{
    public class ChatBoardService : IChatBoardService
    {
        protected readonly DbChatContext chatContext;
        protected readonly IWebHostEnvironment webHostEnvironment;
        protected IHubContext<ChatHub> chatHub;
        private readonly string _storageConnectionString;
        private readonly string _storageContainerName;

        public ChatBoardService(DbChatContext chatContext, IWebHostEnvironment webHostEnvironment, IHubContext<ChatHub> chatHub, IConfiguration configuration)
        {
            this.chatContext = chatContext;
            this.chatHub = chatHub;
            this.webHostEnvironment = webHostEnvironment;
            _storageConnectionString = configuration.GetValue<string>("BlobConnectionString");
            _storageContainerName = configuration.GetValue<string>("BlobContainerName");
        }


        public async Task<List<GroupDto>> GetHistory(string userSession)
        {
            List<GroupDto> groups = await chatContext.Groups
                    .Where(x => x.GroupUsers.Any(y => y.UserCode.Equals(userSession)))
                    .Select(x => new GroupDto()
                    {
                        Code = x.Code,
                        Name = x.Name,
                        Avatar = x.Avatar,
                        Type = x.Type,
                        LastActive = x.LastActive,
                        Users = x.GroupUsers.Select(y => new UserDto()
                        {
                            Code = y.User.Code,
                            FullName = y.User.FullName,
                            Avatar = y.User.Avatar,
                        }).ToList(),
                    }).ToListAsync();

            foreach (var group in groups)
            {
                if (group.Type == Constants.GroupType.SINGLE)
                {
                    var us = group.Users.FirstOrDefault(x => !x.Code.Equals(userSession));
                    group.Name = us?.FullName;
                    group.Avatar = us?.Avatar;
                }

                group.LastMessage = await chatContext.Messages
                    .Where(x => x.GroupCode.Equals(group.Code))
                    .OrderByDescending(x => x.Created)
                    .Select(x => new MessageDto()
                    {
                        Created = x.Created,
                        CreatedBy = x.CreatedBy,
                        Content = x.Content,
                        GroupCode = x.GroupCode,
                        Type = x.Type,
                    })
                    .FirstOrDefaultAsync();
            }


            return groups.OrderByDescending(x => x.LastActive).ToList();
        }

        public async Task<object> GetInfo(string userSession, string groupCode, string contactCode)
        {
            Group group = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(groupCode));

            if (group == null)
            {
                return await chatContext.Users
                        .Where(x => x.Code.Equals(contactCode))
                        .OrderBy(x => x.FullName)
                        .Select(x => new
                        {
                            IsGroup = false,
                            Code = x.Code,
                            Address = x.Address,
                            Avatar = x.Avatar,
                            Dob = x.Dob,
                            Email = x.Email,
                            FullName = x.FullName,
                            Gender = x.Gender,
                            Phone = x.Phone,
                        })
                        .FirstOrDefaultAsync();
            }
            else
            {
                if (group.Type.Equals(Constants.GroupType.SINGLE))
                {
                    string userCode = group.GroupUsers.FirstOrDefault(x => x.UserCode != userSession)?.UserCode;
                    return await chatContext.Users
                            .Where(x => x.Code.Equals(userCode))
                            .OrderBy(x => x.FullName)
                            .Select(x => new
                            {
                                IsGroup = false,
                                Code = x.Code,
                                Address = x.Address,
                                Avatar = x.Avatar,
                                Dob = x.Dob,
                                Email = x.Email,
                                FullName = x.FullName,
                                Gender = x.Gender,
                                Phone = x.Phone
                            })
                             .FirstOrDefaultAsync();
                }
                else
                {
                    return new
                    {
                        IsGroup = true,
                        Code = group.Code,
                        Avatar = group.Avatar,
                        Name = group.Name,
                        Type = group.Type,
                        Users = group.GroupUsers
                            .OrderBy(x => x.User.FullName)
                            .Select(x => new UserDto()
                            {
                                Code = x.User.Code,
                                FullName = x.User.FullName,
                                Avatar = x.User.Avatar
                            }).ToList()
                    };
                }
            }
        }

        public async Task AddGroup(string userCode, GroupDto group)
        {
            DateTime dateNow = DateTime.Now;
            Group grp = new Group()
            {
                Code = Guid.NewGuid().ToString("N"),
                Name = group.Name,
                Created = dateNow,
                CreatedBy = userCode,
                Type = Constants.GroupType.MULTI,
                LastActive = dateNow,
                Avatar = Constants.AVATAR_DEFAULT
            };

            List<GroupUser> groupUsers = group.Users.Select(x => new GroupUser()
            {
                UserCode = x.Code
            }).ToList();

            groupUsers.Add(new GroupUser()
            {
                UserCode = userCode
            });

            grp.GroupUsers = groupUsers;

            await chatContext.Groups.AddAsync(grp);
            await chatContext.SaveChangesAsync();
        }

        public async Task<GroupDto> UpdateGroupAvatar(GroupDto group)
        {
            Group grp = await chatContext.Groups
                .FirstOrDefaultAsync(x => x.Code == group.Code);

            if (grp != null)
            {
                if (group.Avatar.Contains("data:image/png;base64,"))
                {
                    var fileName = Guid.NewGuid().ToString("N") + ".jpg";
                    var data = group.Avatar.Replace("data:image/png;base64,", "");
                    byte[] imageBytes = Convert.FromBase64String(data);
                    string localDir = Path.Combine(webHostEnvironment.WebRootPath, "avatars");
                    FileHelper.CreateDirectory(localDir);
                    string localPath = Path.Combine(localDir, fileName);
                    using (var stream = new FileStream(localPath, FileMode.Create))
                    {
                        await stream.WriteAsync(imageBytes, 0, imageBytes.Length);
                    }
                    var urlImg = $"/avatars/{fileName}";
                    grp.Avatar = group.Avatar = urlImg;
                }
                await chatContext.SaveChangesAsync();
            }
            return group;
        }

        public async Task UploadBlobFile(IFormFile blob)
        {
            BlobContainerClient container = new BlobContainerClient(_storageConnectionString, _storageContainerName);

            // Create the container if it does not exist
            await container.CreateIfNotExistsAsync();
            BlobClient client = container.GetBlobClient(blob.FileName);

            // Open a stream for the file we want to upload
            await using (Stream data = blob.OpenReadStream())
            {
                // Upload the file async
                await client.UploadAsync(data);
            }


        }
        public async Task SendMessage(string userCode, string groupCode, MessageDto message)
        {
            Group grp = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(groupCode));
            DateTime dateNow = DateTime.Now;

            if (grp == null)
            {
                string grpCode = await chatContext.Groups
                    .Where(x => x.Type.Equals(Constants.GroupType.SINGLE))
                    .Where(x => x.GroupUsers.Any(y => y.UserCode.Equals(userCode) &&
                                x.GroupUsers.Any(y => y.UserCode.Equals(message.SendTo))))
                    .Select(x => x.Code)
                    .FirstOrDefaultAsync();

                grp = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(grpCode));
            }

            if (grp == null)
            {
                User sendTo = await chatContext.Users.FirstOrDefaultAsync(x => x.Code.Equals(message.SendTo));
                grp = new Group()
                {
                    Code = Guid.NewGuid().ToString("N"),
                    Name = sendTo.FullName,
                    Created = dateNow,
                    CreatedBy = userCode,
                    Type = Constants.GroupType.SINGLE,
                    GroupUsers = new List<GroupUser>()
                        {
                            new GroupUser()
                            {
                                UserCode = userCode
                            },
                            new GroupUser()
                            {
                                UserCode = sendTo.Code
                            }
                        }
                };
                await chatContext.Groups.AddAsync(grp);
            }

            if (message.Attachments != null && message.Attachments.Count > 0)
            {
                string year = DateTime.Now.Year.ToString();
                string localDir = Path.Combine(webHostEnvironment.WebRootPath, "attachments", year);
                FileHelper.CreateDirectory(localDir);
                try
                {
                    if (message.Attachments[0].Length > 0)
                    {
                        string fileName = Guid.NewGuid().ToString("N") + Path.GetExtension(message.Attachments[0].FileName);
                        string localPath = Path.Combine(localDir, fileName);
                        using (var stream = new FileStream(localPath, FileMode.Create))
                        {
                            await message.Attachments[0].CopyToAsync(stream);
                        }
                        message.Content = message.Attachments[0].FileName;
                        message.Path = $"/attachments/{year}/{fileName}";
                    }
                }
                catch
                {
                    throw;
                }
            }

            Message msg = new Message()
            {
                Content = message.Content,
                Created = dateNow,
                CreatedBy = userCode,
                GroupCode = grp.Code,
                Path = message.Path,
                Type = message.Type,
            };

            grp.LastActive = dateNow;

            await chatContext.Messages.AddAsync(msg);
            await chatContext.SaveChangesAsync();
            try
            {
               await chatHub.Clients.All.SendAsync("messageHubListener", true);
            }
            catch (Exception ex)
            {
                
            }
        }
        public async Task<List<MessageDto>> GetMessageByGroup(string userCode, string groupCode)
        {
            return await chatContext.Messages
                    .Where(x => x.GroupCode.Equals(groupCode))
                    .Where(x => x.Group.GroupUsers.Any(y => y.UserCode.Equals(userCode)))
                    .OrderBy(x => x.Created)
                    .Select(x => new MessageDto()
                    {
                        Created = x.Created,
                        Content = x.Content,
                        CreatedBy = x.CreatedBy,
                        GroupCode = x.GroupCode,
                        Id = x.Id,
                        Path = x.Path,
                        Type = x.Type,
                        UserCreatedBy = new UserDto()
                        {
                            Avatar = x.UserCreatedBy.Avatar
                        }
                    }).ToListAsync();
        }

        public async Task<List<MessageDto>> GetMessageByContact(string userCode, string contactCode)
        {
            string groupCode = await chatContext.Groups
                    .Where(x => x.Type.Equals(Constants.GroupType.SINGLE))
                    .Where(x => x.GroupUsers.Any(y => y.UserCode.Equals(userCode) &&
                                x.GroupUsers.Any(y => y.UserCode.Equals(contactCode))))
                    .Select(x => x.Code)
                    .FirstOrDefaultAsync();

            return await chatContext.Messages
                    .Where(x => x.GroupCode.Equals(groupCode))
                    .Where(x => x.Group.GroupUsers.Any(y => y.UserCode.Equals(userCode)))
                    .OrderBy(x => x.Created)
                    .Select(x => new MessageDto()
                    {
                        Created = x.Created,
                        Content = x.Content,
                        CreatedBy = x.CreatedBy,
                        GroupCode = x.GroupCode,
                        Id = x.Id,
                        Path = x.Path,
                        Type = x.Type,
                        UserCreatedBy = new UserDto()
                        {
                            Avatar = x.UserCreatedBy.Avatar
                        }
                    }).ToListAsync();
        }

        // Clear all messages for a group
        public async Task ClearMessagesByGroup(string groupCode)
        {
            var messages = chatContext.Messages.Where(x => x.GroupCode == groupCode);
            chatContext.Messages.RemoveRange(messages);
            await chatContext.SaveChangesAsync();
        }

        // Clear all messages between two users (direct chat)
        public async Task ClearMessagesByContact(string userCode, string contactCode)
        {
            // Find the group code for the direct chat
            var groupCode = await chatContext.Groups
                .Where(x => x.Type == Constants.GroupType.SINGLE)
                .Where(x => x.GroupUsers.Any(y => y.UserCode == userCode) &&
                            x.GroupUsers.Any(y => y.UserCode == contactCode))
                .Select(x => x.Code)
                .FirstOrDefaultAsync();
            if (!string.IsNullOrEmpty(groupCode))
            {
                var messages = chatContext.Messages.Where(x => x.GroupCode == groupCode);
                chatContext.Messages.RemoveRange(messages);
                await chatContext.SaveChangesAsync();
            }
        }
    }
}
