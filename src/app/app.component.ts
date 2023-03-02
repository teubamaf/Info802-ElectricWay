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
}
    

