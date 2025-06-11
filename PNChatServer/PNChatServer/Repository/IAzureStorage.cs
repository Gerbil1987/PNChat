using PNChatServer.Dto;

namespace PNChatServer.Repository
{
    public interface IAzureStorage
    {
        Task<string> UploadBlobFile(string filePath, string filename);
        Task<BlobDto> DownloadAsync(string url);
    }
}
