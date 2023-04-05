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
  
  dataVar: any = "This will be replaced by data fetched through API GW origin.";
  getCfData(): void {
    this.getDataService.getCfData().subscribe((data) => {this.dataVar = JSON.stringify(data)});
  }
}
