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
            .WithOrigins("http://localhost:4200")
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
app.UseRouting();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<ChatHub>("/chatHub");
});

//app.MapGet("/", () => "Hello World!");

app.Run();
