import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import * as L from 'leaflet';
import { tap } from 'rxjs';
import * as geojson from 'geojson';
import { MapService } from 'src/app/services/map.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  private map!: any;
  startCity!: string;
  destCity!: string;
  mapService: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 45.564601, 5.917781 ],
      zoom: 3
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);

  }

   
  onSubmitForm() {
    this.mapService.getGeoCoding(this.startCity).pipe(
      tap(value => {
        this.map.setView(new L.LatLng(value.lat, value.lon), 7, { animation: true });
        L.marker(new L.LatLng(value.lat, value.lon)).addTo(this.map);
      })
    ).subscribe();
  }
}