using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PNChatServer.Data;
using PNChatServer.Hubs;
using PNChatServer.Repository;
using PNChatServer.Service;
using PNChatServer.Utils;


var policy = "_anyCorsPolicy";

var builder = WebApplication.CreateBuilder(args);

EnviConfig.Config(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev",
        policy => policy
            .WithOrigins("http://localhost:4200", "http://197.242.158.172:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
    );
});

builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    {
        Title = "PNChat API",
        Version = "v1" 
    
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter the Bearer Authorization string as following: `Bearer Generated-JWT-Token`",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Name = "Bearer",
                In = ParameterLocation.Header,
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            new string[]{}
        }
    });
});

#region jwt
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
#endregion

#region blob storage
builder.Services.AddScoped(x => new BlobServiceClient(EnviConfig.BlobConnectionString));
#endregion

#region EntityFramework Core
builder.Services.AddDbContext<DbChatContext>(option =>
{
    option.UseLazyLoadingProxies().UseSqlServer(EnviConfig.ProdConnectionString);
});
#endregion

#region dependency injection
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICallService, CallService>();
builder.Services.AddScoped<IChatBoardService, ChatBoardService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddTransient<IAzureStorage, AzureStorage>();
#endregion

var app = builder.Build();

app.UseCors("AllowAngularDev");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PNChat API V1");
    });
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Add this line to serve static files
app.UseRouting();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<ChatHub>("/chatHub");
});

// Create SOS group at startup
using (var scope = app.Services.CreateScope())
{
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    var chatBoardService = scope.ServiceProvider.GetRequiredService<IChatBoardService>();
    var dbContext = scope.ServiceProvider.GetRequiredService<PNChatServer.Data.DbChatContext>();
    var users = await userService.GetAllUsers();
    // Remove duplicate users by Code
    var userDtos = users
        .GroupBy(u => u.Code)
        .Select(g => g.First())
        .Select(u => new PNChatServer.Dto.UserDto {
            Code = u.Code,
            FullName = u.FullName,
            Avatar = u.Avatar,
            Email = u.Email,
            Gender = u.Gender,
            Phone = u.Phone,
            Address = u.Address,
            Dob = u.Dob
        }).ToList();

    // Check if SOS group exists
    var sosGroup = dbContext.Groups.Include(g => g.GroupUsers).FirstOrDefault(g => g.Name == "SOS" && g.Type == "multi");
    if (sosGroup != null)
    {
        // Remove all existing users from the group
        var existingGroupUsers = dbContext.GroupUsers.Where(gu => gu.GroupCode == sosGroup.Code);
        dbContext.GroupUsers.RemoveRange(existingGroupUsers);
        await dbContext.SaveChangesAsync();
        // Add all current users to the group, only unique UserCodes
        var uniqueUserCodes = new HashSet<string>();
        foreach (var user in userDtos)
        {
            if (!uniqueUserCodes.Contains(user.Code))
            {
                dbContext.GroupUsers.Add(new PNChatServer.Models.GroupUser {
                    GroupCode = sosGroup.Code,
                    UserCode = user.Code
                });
                uniqueUserCodes.Add(user.Code);
            }
        }
        await dbContext.SaveChangesAsync();
    }
    else
    {
        // Use the first user as the creator/admin
        if (userDtos.Count > 0)
        {
            var group = new PNChatServer.Dto.GroupDto {
                Name = "SOS",
                Users = userDtos
            };
            await chatBoardService.AddGroup(userDtos[0].Code, group);
        }
    }
}

//app.MapGet("/", () => "Hello World!");

app.Run();
