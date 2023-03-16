import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { InfoService } from 'src/app/services/info.service';


@Component({
  selector: 'app-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss']
})
export class InfoComponent implements OnInit {

  autonomy$!: Observable<number | null>;
  duration$!: Observable<number | null>;
  distance$!: Observable<number | null>;
  nbRecharge$!: Observable<number | null>;
  price$! :Observable<number | null > ;


  constructor(private infoService: InfoService) { }


  ngOnInit(): void {
    this.duration$ = this.infoService.duration$;
    this.distance$ = this.infoService.distance$;
    this.nbRecharge$ = this.infoService.nbRecharge$;
    this.autonomy$ = this.infoService.autonomy$;
    this.price$ = this.infoService.price$;
  }
}