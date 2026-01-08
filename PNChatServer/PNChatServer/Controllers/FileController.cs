using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;

namespace PNChatServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public FileController(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        [Route("img")]
        [HttpGet]
        public async Task<IActionResult> GetImage(string key)
        {
            // Strip any leading slash for path concatenation
            key = key.TrimStart('/');
            
            // Check if it's a system path (for default images)
            if (key.StartsWith("assets/"))
            {
                // Assets are served by the static files middleware, let's generate a URL to redirect to
                return Redirect($"/{key}");
            }

            string filePath = Path.Combine(_webHostEnvironment.WebRootPath, key);
            
            if (!System.IO.File.Exists(filePath))
            {
                // Return default image if file not found
                return NotFound();
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            
            // Determine content type
            string contentType;
            var extension = Path.GetExtension(key).ToLowerInvariant();
            switch (extension)
            {
                case ".jpg":
                case ".jpeg":
                    contentType = "image/jpeg";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                case ".gif":
                    contentType = "image/gif";
                    break;
                default:
                    contentType = "application/octet-stream";
                    break;
            }
            
            return File(fileBytes, contentType);
        }
    }
}
