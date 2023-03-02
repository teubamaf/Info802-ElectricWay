import { Component, OnInit } from '@angular/core';
import { catchError, filter, repeatWhen, take, tap, pipe } from 'rxjs';
import { SoapCalculService } from './services/soap-calcul.service';
import { BornesService } from './services/bornes.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'info-802';

  bornes: any[]= [];

  constructor(private borneService : BornesService){}



  ngOnInit(): void{
    const lat = 45.564601;
    const lon = 5.917781;
    let radius = 100;

    /*let obs: any = this.borne.getbornes(lat, lon, radius).pipe(
      tap(value => {
        console.log('tap: ' + radius);
        console.log(value);
      }),
      catchError( err => {
        console.log(radius);
        radius = radius * 100;
        return err
      })
    );
    obs.subscribe();*/
    this.borneService.getbornes(lat, lon, radius).pipe(
      tap(value => {
        console.log(value)
      })
    ).subscribe();
  }
}
    

