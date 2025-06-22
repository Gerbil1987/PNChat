using Microsoft.AspNetCore.Mvc;
using PNChatServer.Dto;
using PNChatServer.Models;
using PNChatServer.Repository;
using PNChatServer.Service;
using System;

namespace PNChatServer.Controllers
{
    [Route("api")]
    [ApiController]
    public class AuthsController : ControllerBase
    {
        private IAuthService _authService;
        private IWebHostEnvironment _webHostEnvironment;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IAzureStorage _azureStorage;

        public AuthsController(IAuthService authService, IAzureStorage azureStorage, IWebHostEnvironment webHostEnvironment, IHttpContextAccessor contextAccessor)
        {
            _authService = authService;
            _azureStorage = azureStorage;
            _webHostEnvironment = webHostEnvironment;
            _contextAccessor = contextAccessor;
        }


        [Route("auths/login")]
        [HttpPost]
        public async Task<IActionResult> Login(User user)
        {
            ResponseAPI responseAPI = new ResponseAPI();
            try
            {
                AccessToken accessToken = await _authService.Login(user);
                responseAPI.Data = accessToken;
                
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(ex.Message);
            }
        }

        [Route("auths/sign-up")]
        [HttpPost]
        public async Task<IActionResult> SignUp(User user)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                await _authService.SignUp(user);
                return Ok(responseAPI);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [HttpGet("img")]
        public IActionResult DownloadImage(string key)
        {
            try
            {
                // If the key is a local path (not a full URL), serve from wwwroot/images
                if (!string.IsNullOrEmpty(key) && !key.Contains("http"))
                {
                    var imagePath = Path.Combine(_webHostEnvironment.WebRootPath, key.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (!System.IO.File.Exists(imagePath))
                        return NotFound();
                    var ext = Path.GetExtension(imagePath).ToLower();
                    var contentType = ext == ".png" ? "image/png" : "image/jpeg";
                    var image = System.IO.File.OpenRead(imagePath);
                    return File(image, contentType);
                }
                // Otherwise, try to download from Azure (legacy)
                BlobDto result = _azureStorage.DownloadAsync(key).GetAwaiter().GetResult();
                return File(result.Content, result.ContentType);
            }
            catch (Exception ex)
            {
                return BadRequest();
            }
        }

        [HttpGet("file")]
        public async Task<IActionResult> DownloadFile(string key)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                //string path = Path.Combine(_webHostEnvironment.ContentRootPath, key);
                //Stream stream = new FileStream(path, FileMode.Open);
                responseAPI.Data = "";
                BlobDto result = await _azureStorage.DownloadAsync(key);

                return File(result.Content, result.ContentType, result.Name);
                //return File(stream, "application/octet-stream", key);
            }
            catch (Exception ex)
            {
                responseAPI.Message = ex.Message;
                return BadRequest(responseAPI);
            }
        }

        [Route("post-hubconnection")]
        [HttpPost]
        public async Task<IActionResult> PutHubConnection(string key)
        {
            ResponseAPI responseAPI = new ResponseAPI();

            try
            {
                string userSession = SystemAuthorization.GetCurrentUser(_contextAccessor);
                await _authService.PutHubConnection(userSession, key);

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
