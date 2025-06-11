using PNChatServer.Dto;
using PNChatServer.Models;

namespace PNChatServer.Repository
{
    public interface IAuthService
    {
        Task<AccessToken> Login(User user);
        Task SignUp(User user);
        Task PutHubConnection(string userSession, string key);
    }
}
