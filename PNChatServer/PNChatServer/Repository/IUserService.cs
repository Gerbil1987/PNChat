using PNChatServer.Dto;

namespace PNChatServer.Repository
{
    public interface IUserService
    {
        Task<UserDto> GetProfile(string userCode);
        Task<UserDto> UpdateProfile(string userCode, UserDto user);
        Task<List<UserDto>> GetContact(string userCode);
        Task<List<UserDto>> SearchContact(string userCode, string keySearch);
        Task AddContact(string userCode, UserDto user);
    }
}
