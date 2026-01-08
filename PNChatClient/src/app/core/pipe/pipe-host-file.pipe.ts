import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UrlHelper } from '../utils/url-helper';

@Pipe({
  name: 'pipeHostFile',
})
export class PipeHostFilePipe implements PipeTransform {
  //If the image is in base64 format => keep the base6 display
  //Otherwise => Get image via server
  transform(value: any, ...args: any[]): any {
    if (value == null || value.indexOf('data:image/png;base64,') >= 0)
      return value;
    
    // Check if this is the default avatar path
    if (value === '/assets/images/no_image.jpg') {
      const baseUrl = UrlHelper.baseUrl;
      // Direct path for the default avatar
      const url = baseUrl + 'assets/images/no_image.jpg';
      console.log('Default avatar URL:', url);
      return url;
    }
    
    // For regular user-uploaded images
    const baseUrl = UrlHelper.baseUrl;
    const url = baseUrl + 'api/file/img?key=' + value;
    console.log('User image URL:', url);
    return url;
  }
}
