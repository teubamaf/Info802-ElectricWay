import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BornesService {

  constructor(private http: HttpClient) { }

  private API_URI = 'https://odre.opendatasoft.com/explore/dataset/bornes-irve/api/records/1.0/search/?dataset=bornes-irve&q=';

  getbornes(latitude: number,longitude : number ,radius: number){
    const url = this.API_URI+'&geofilter.distance=${latitude}%2C${longitude}%2C${radius}'

    this.http.get<any>(url).pipe(
      map(value => {
        if (value.nhit == 0){
          throw console.error("error");
      }
      return value.records[0]
      },
      )
    )
  }
}
