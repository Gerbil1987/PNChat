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

    const formatString = isSameDay ? 'HH:mm' : 'ddd DD/MM HH:mm';
    return moment(value).locale('za').format(formatString);
  }
}
