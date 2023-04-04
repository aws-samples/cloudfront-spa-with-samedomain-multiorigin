import { Component, OnInit } from '@angular/core';
import { GetDataService } from '../get-data.service';

@Component({
  selector: 'app-front',
  templateUrl: './front.component.html',
  styleUrls: ['./front.component.css']
})
export class FrontComponent implements OnInit {

  constructor(private getDataService: GetDataService) { }

  ngOnInit(): void {
  }

  getData(): void {
    console.log("from front");
    this.getDataService.getData().subscribe();
  }
  getCfData(): void {
    console.log("from cf front");
    this.getDataService.getCfData().subscribe();
  }
}
