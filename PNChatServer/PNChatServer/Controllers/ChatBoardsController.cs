using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using PNChatServer.Dto;
using PNChatServer.Repository;

namespace PNChatServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatBoardsController : ControllerBase
    {
        private IChatBoardService _chatBoardService;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IUserService _userService;

        public ChatBoardsController(IChatBoardService chatBoardService, IHttpContextAccessor contextAccessor, IUserService userService)
        {
            _chatBoardService = chatBoardService;
            _contextAccessor = contextAccessor;
            _userService = userService;
        }

        [Route("get-history")]
        [HttpGet]
        public async Task<IActionResult> GetHistory()
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                responseAPI.Data = await _chatBoardService.GetHistory(userSession);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }


        [Route("get-info")]
        [HttpGet]
        public async Task<IActionResult> GetInfo(string groupCode, string contactCode)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                responseAPI.Data = await _chatBoardService.GetInfo(userSession, groupCode, contactCode);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }


        [Route("groups")]
        [HttpPost]
        public async Task<IActionResult> AddGroup(GroupDto group)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                await _chatBoardService.AddGroup(userSession, group);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }


        [Route("update-group-avatar")]
        [HttpPut]
        public async Task<IActionResult> UpdateGroupAvatar(GroupDto group)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                responseAPI.Data = await _chatBoardService.UpdateGroupAvatar(group);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }


        [Route("send-message")]
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromQuery] string groupCode)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string jsonMessage = HttpContext.Request.Form["data"]!;
                var settings = new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore,
                    MissingMemberHandling = MissingMemberHandling.Ignore,
                };

                MessageDto message = JsonConvert.DeserializeObject<MessageDto>(jsonMessage, settings);
                message.Attachments = Request.Form.Files.ToList();

                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                await _chatBoardService.SendMessage(userSession, groupCode, message);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("get-message-by-group/{groupCode}")]
        [HttpGet]
        public async Task<IActionResult> GetMessageByGroup(string groupCode)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                responseAPI.Data = await _chatBoardService.GetMessageByGroup(userSession, groupCode);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }


        [Route("get-message-by-contact/{contactCode}")]
        [HttpGet]
        public async Task<IActionResult> GetMessageByContact(string contactCode)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                responseAPI.Data = await _chatBoardService.GetMessageByContact(userSession, contactCode);

                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("add-user-to-group")]
        [HttpPost]
        public async Task<IActionResult> AddUserToGroup([FromBody] AddUserToGroupDto data)
        {
            ResponseAPI responseAPI = new ResponseAPI();
            try
            {
                await _chatBoardService.AddUserToGroup(data.GroupCode, data.UserCode);
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("remove-user-from-group")]
        [HttpPost]
        public async Task<IActionResult> RemoveUserFromGroup([FromBody] AddUserToGroupDto data)
        {
            ResponseAPI responseAPI = new ResponseAPI();
            try
            {
                await _chatBoardService.RemoveUserFromGroup(data.GroupCode, data.UserCode);
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("delete-message/{messageId}")]
        [HttpDelete]
        public async Task<IActionResult> DeleteMessage(long messageId)
        {
            ResponseAPI responseAPI = new ResponseAPI();
            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                await _chatBoardService.DeleteMessage(userSession, messageId);
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("create-sos-group")]
        [HttpPost]
        public async Task<IActionResult> CreateSOSGroup()
        {
            ResponseAPI responseAPI = new ResponseAPI();
            try
            {
                // Get all users
                var users = await _userService.GetAllUsers();
                var userDtos = users.Select(u => new UserDto {
                    Code = u.Code,
                    FullName = u.FullName,
                    Avatar = u.Avatar,
                    Email = u.Email,
                    Gender = u.Gender,
                    Phone = u.Phone,
                    Address = u.Address,
                    Dob = u.Dob
                }).ToList();
                // Create SOS group
                var group = new GroupDto {
                    Name = "SOS",
                    Users = userDtos
                };
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                await _chatBoardService.AddGroup(userSession, group);
                responseAPI.Data = "SOS group created";
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }
    }
}
