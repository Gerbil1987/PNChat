import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
import 'moment/locale/vi';
@Pipe({
  name: 'chatDate',
})
export class ChatDatePipe implements PipeTransform {
  // If same day display time
  // Different day display date and time
  transform(value: any, ...args: any[]): any {
    const currentDate = new Date();
    const dateCompare = moment(value).toDate();
    const isSameDay = currentDate.toDateString() === dateCompare.toDateString();

    const formatString = isSameDay ? 'h:mm a' : 'ddd DD/MM [Lúc] h:mm a';
    return moment(value).locale('vi').add(7, 'hours').format(formatString);
  }
}
