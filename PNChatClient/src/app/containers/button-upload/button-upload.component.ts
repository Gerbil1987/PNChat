import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DataHelper } from 'src/app/core/utils/data-helper';
import { PipeHostFilePipe } from 'src/app/core/pipe/pipe-host-file.pipe';

@Component({
  selector: 'button-upload',
  templateUrl: './button-upload.component.html',
})
export class ButtonUploadComponent implements OnInit {
  @Input()
  srcDefault: string = '/assets/images/no_image.jpg'; // Use local image for default

  @Output()
  onload = new EventEmitter<string>();

  @ViewChild('inpFile', { static: true }) inpFileElement!: ElementRef;
  constructor() {}

  ngOnInit() {}

  chooseFile() {
    this.inpFileElement.nativeElement.click();
  }

  onFileChange(evt: any) {
    const target: DataTransfer = <DataTransfer>evt.target;
    if (target.files.length === 0) {
      this.srcDefault = '';
      return;
    }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        var bytes = new Uint8Array(e.target.result);
        this.srcDefault = 'data:image/png;base64,' + DataHelper.toBase64(bytes);
        this.onload.emit(this.srcDefault);
      } catch (error) {
        alert('Lỗi ảnh');
      }
    };
    reader.readAsArrayBuffer(target.files[0]);
  }
}
