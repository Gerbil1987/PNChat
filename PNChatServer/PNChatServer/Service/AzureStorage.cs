using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs;
using Azure;
using PNChatServer.Dto;
using PNChatServer.Repository;
using Azure.Storage;
using System;

namespace PNChatServer.Service
{
    public class AzureStorage : IAzureStorage
    {
        private readonly BlobServiceClient _blobServiceClient;
        private BlobContainerClient client;
        public static readonly List<string> ImageExtensions = new List<string> { ".JPG", ".JPEG", ".PNG" };

        public AzureStorage(BlobServiceClient blobServiceClient)
        {
            _blobServiceClient = blobServiceClient;
            client = _blobServiceClient.GetBlobContainerClient("blobcontainer");
        }
        public async Task<BlobDto> DownloadAsync(string url)
        {
            var fileName = new Uri(url).Segments.LastOrDefault();

            try
            {
                var blobClient = client.GetBlobClient(fileName);
                if (await blobClient.ExistsAsync())
                {
                    BlobDownloadResult content = await blobClient.DownloadContentAsync();
                    var downloadedData = content.Content.ToStream();

                    if (ImageExtensions.Contains(Path.GetExtension(fileName.ToUpperInvariant())))
                    {
                        var extension = Path.GetExtension(fileName);
                        return new BlobDto { Content = downloadedData, ContentType = "image/" + extension.Remove(0, 1) };
                    }
                    else
                    {
                        string name = fileName;
                        return new BlobDto { Content = downloadedData, Name = name, ContentType = content.Details.ContentType };
                    }

                }
                else
                {
                    return null;
                }

            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<string> UploadBlobFile(string filePath, string filename)
        {
            var blobClient = client.GetBlobClient(filename);
            var status = await blobClient.UploadAsync(filePath);

            return blobClient.Uri.AbsoluteUri;
        }
    }
}
