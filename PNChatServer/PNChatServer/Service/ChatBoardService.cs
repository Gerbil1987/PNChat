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
                    .Where(x => x.Content != "[deleted]")
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

            // If no group found by groupCode, try to find an existing direct message group with the contact
            if (group == null && !string.IsNullOrEmpty(contactCode))
            {
                System.Console.WriteLine($"[GetInfo] No group by code, looking for existing SINGLE group with contact: {contactCode}");
                string existingGroupCode = await chatContext.Groups
                    .Where(x => x.Type.Equals(Constants.GroupType.SINGLE))
                    .Where(x => x.GroupUsers.Any(y => y.UserCode.Equals(userSession) &&
                                x.GroupUsers.Any(y => y.UserCode.Equals(contactCode))))
                    .Select(x => x.Code)
                    .FirstOrDefaultAsync();
                
                if (!string.IsNullOrEmpty(existingGroupCode))
                {
                    System.Console.WriteLine($"[GetInfo] Found existing SINGLE group: {existingGroupCode}");
                    group = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(existingGroupCode));
                }
                else
                {
                    System.Console.WriteLine($"[GetInfo] No existing SINGLE group found, will return user info with user code");
                }
            }

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
                    // Return both the direct message group info AND the Users array
                    // This allows the frontend to extract the contact code from Users
                    return await Task.FromResult(new
                    {
                        IsGroup = false,
                        Code = group.Code,  // Return the GROUP code!
                        Type = group.Type,
                        Avatar = group.Avatar,
                        Name = group.GroupUsers
                            .OrderBy(x => x.User.FullName)
                            .Where(x => x.UserCode != userSession)
                            .Select(x => x.User.FullName)
                            .FirstOrDefault() ?? "",
                        Users = group.GroupUsers
                            .OrderBy(x => x.User.FullName)
                            .Select(x => new UserDto()
                            {
                                Code = x.User.Code,
                                FullName = x.User.FullName,
                                Avatar = x.User.Avatar
                            }).ToList()
                    });
                }
                else
                {
                    return await Task.FromResult(new
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
                    });
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
            Group grp = null;
            DateTime dateNow = DateTime.Now;
            
            // Debug logging
            System.Console.WriteLine($"[SendMessage] START - userCode: {userCode}, groupCode: {groupCode}, SendTo: {message.SendTo}, Content: {message.Content}");
            
            // Only try to look up by groupCode if it's provided and not empty
            if (!string.IsNullOrEmpty(groupCode))
            {
                System.Console.WriteLine($"[SendMessage] Looking up group by code: {groupCode}");
                grp = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(groupCode));
                if (grp != null)
                {
                    System.Console.WriteLine($"[SendMessage] Found group by code: {grp.Code}, Type: {grp.Type}, Name: {grp.Name}");
                }
                else
                {
                    System.Console.WriteLine($"[SendMessage] ❌ Group NOT found by code: {groupCode}");
                    // Log all groups to debug
                    var allGroups = await chatContext.Groups.ToListAsync();
                    System.Console.WriteLine($"[SendMessage] Total groups in database: {allGroups.Count}");
                    foreach (var g in allGroups)
                    {
                        System.Console.WriteLine($"[SendMessage]   - Group: {g.Code}, Type: {g.Type}");
                    }
                }
            }

            if (grp == null)
            {
                // Try to find or create a single-type group with SendTo
                if (!string.IsNullOrEmpty(message.SendTo))
                {
                    System.Console.WriteLine($"[SendMessage] Looking up single-type group with SendTo: {message.SendTo}");
                    string grpCode = await chatContext.Groups
                        .Where(x => x.Type.Equals(Constants.GroupType.SINGLE))
                        .Where(x => x.GroupUsers.Any(y => y.UserCode.Equals(userCode)) &&
                                    x.GroupUsers.Any(y => y.UserCode.Equals(message.SendTo)))
                        .Select(x => x.Code)
                        .FirstOrDefaultAsync();

                    if (!string.IsNullOrEmpty(grpCode))
                    {
                        System.Console.WriteLine($"[SendMessage] Found single-type group: {grpCode}");
                        grp = await chatContext.Groups.FirstOrDefaultAsync(x => x.Code.Equals(grpCode));
                    }
                    else
                    {
                        System.Console.WriteLine($"[SendMessage] No existing single-type group found for users {userCode} and {message.SendTo}");
                    }
                }
            }

            // If still not found, try to create a new direct message group
            if (grp == null && !string.IsNullOrEmpty(message.SendTo))
            {
                // Only try to create a direct message group if SendTo is provided
                if (!string.IsNullOrEmpty(message.SendTo))
                {
                    System.Console.WriteLine($"[SendMessage] Creating new direct message group for SendTo: {message.SendTo}");
                    User sendTo = await chatContext.Users.FirstOrDefaultAsync(x => x.Code.Equals(message.SendTo));
                    if (sendTo != null)
                    {
                        System.Console.WriteLine($"[SendMessage] Found recipient: {sendTo.FullName}");
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
                        System.Console.WriteLine($"[SendMessage] Created new group: {grp.Code}");
                    }
                    else
                    {
                        System.Console.WriteLine($"[SendMessage] Recipient not found: {message.SendTo}");
                    }
                }
            }

            // If we still don't have a group, throw an error
            if (grp == null)
            {
                System.Console.WriteLine($"[SendMessage] ❌ FAILED - Could not find or create group");
                throw new ArgumentException("Invalid group or recipient specified");
            }

            System.Console.WriteLine($"[SendMessage] Proceeding with group: {grp.Code}, Type: {grp.Type}");

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
                GroupCode = grp != null ? grp.Code : throw new ArgumentException("Invalid group or recipient specified"),
                Path = message.Path,
                Type = message.Type,
            };

            if (grp != null)
            {
                grp.LastActive = dateNow;
            }

            await chatContext.Messages.AddAsync(msg);
            await chatContext.SaveChangesAsync();
            try
            {
               await chatHub.Clients.All.SendAsync("messageHubListener", true);
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[SendMessage] Error notifying hub: {ex.Message}");
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
        public async Task AddUserToGroup(string groupCode, string userCode)
        {
            var group = await chatContext.Groups.Include(g => g.GroupUsers).FirstOrDefaultAsync(g => g.Code == groupCode);
            if (group == null)
                throw new Exception("Group not found");
            if (group.GroupUsers.Any(gu => gu.UserCode == userCode))
                throw new Exception("User already in group");
            group.GroupUsers.Add(new GroupUser { GroupCode = groupCode, UserCode = userCode });
            await chatContext.SaveChangesAsync();
        }
        public async Task RemoveUserFromGroup(string groupCode, string userCode)
        {
            var group = await chatContext.Groups.Include(g => g.GroupUsers).FirstOrDefaultAsync(g => g.Code == groupCode);
            if (group == null)
                throw new Exception("Group not found");
            var groupUser = group.GroupUsers.FirstOrDefault(gu => gu.UserCode == userCode);
            if (groupUser == null)
                throw new Exception("User not in group");
            group.GroupUsers.Remove(groupUser);
            await chatContext.SaveChangesAsync();
        }
        public async Task DeleteMessage(string userSession, long messageId)
        {
            var message = await chatContext.Messages.FirstOrDefaultAsync(m => m.Id == messageId);
            if (message == null)
                throw new Exception("Message not found");
            if (message.CreatedBy != userSession)
                throw new Exception("You can only delete your own messages");
            chatContext.Messages.Remove(message);
            await chatContext.SaveChangesAsync();
        }
    }
}
