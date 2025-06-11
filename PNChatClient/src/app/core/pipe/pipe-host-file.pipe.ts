import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

@Pipe({
  name: 'pipeHostFile',
})
export class PipeHostFilePipe implements PipeTransform {
  //If the image is in base64 format => keep the base6 display
  //Otherwise => Get image via server
  transform(value: any, ...args: any[]): any {
    if (value == null || value.indexOf('data:image/png;base64,') >= 0)
      return value;
    return environment.apiUrl + 'img?key=' + value;
  }
}
