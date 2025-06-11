using Microsoft.AspNetCore.Mvc;

namespace PNChatServer.Controllers
{

    public class SystemAuthorizeAttribute : TypeFilterAttribute
    {
        public SystemAuthorizeAttribute() : base(typeof(SystemAuthorizeAttribute)) { }
    }
}
