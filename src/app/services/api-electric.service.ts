import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs';
import { InfoService } from './info.service';

@Injectable({
  providedIn: 'root'
})
export class ApiElectricService {

  private API_URI = 'https://api-projet802-lebzvv107-teubamaf.vercel.app/';

  constructor(private http: HttpClient , private infoService: InfoService) { }

  getprix(distancekm : number ){
    this.http.post<any>(this.API_URI, { km: distancekm }).pipe(
      map(value => value.price),
      tap(value => this.infoService.setPrice(value))
    ).subscribe();
  }
}
