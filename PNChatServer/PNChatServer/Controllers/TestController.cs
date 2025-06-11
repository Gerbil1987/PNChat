using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace PNChatServer.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public string Get()
        {
            return "PNChat API already";
        }
    }
}
