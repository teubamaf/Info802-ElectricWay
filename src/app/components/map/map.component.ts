import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import('leaflet-routing-machine');
import { Observable, tap, zip, zipAll } from 'rxjs';
import { BorneService } from 'src/app/services/borne.service';
import { InfoService } from 'src/app/services/info.service';
import { MapService } from 'src/app/services/map.service';
import { SoapCalculService } from 'src/app/services/soap-calcul.service';
import { ApiElectricService } from 'src/app/services/api-electric.service';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  startCity!: string;
  destCity!: string;

  startCities$!: Observable<string[]>;
  destCities$!: Observable<string[]>;

  private map!: any;
  private route!: any;


  autonomyKm: number = 0;

  constructor(
    private mapService: MapService,
    private borneService: BorneService,
    private soapCalculService: SoapCalculService,
    private infoService: InfoService,
    private apiservice : ApiElectricService
  ) { }

  ngOnInit(): void {
    this.initMap();

    this.startCities$ = this.mapService.startCities$;
    this.destCities$ = this.mapService.destCities$;

    this.infoService.autonomy$.pipe(
      tap(value => this.autonomyKm = value)
    ).subscribe();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [ 45.564601, 5.917781 ],
      zoom: 3
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 1,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  onSubmitForm() {
    
    if (this.route) {
      this.map.removeControl(this.route);
    }

    zip(
      this.mapService.getGeoCoding(this.startCity),
      this.mapService.getGeoCoding(this.destCity)
    ).pipe(
      tap(value => {
        const start = value[0];
        const dest = value[1];

        const waypoint1 = new L.LatLng(start.lat, start.lon);
        const waypoint2 = new L.LatLng(dest.lat, dest.lon);

        this.firstTraceRoute([waypoint1, waypoint2]);
      })
    ).subscribe();
  }


  private firstTraceRoute(waypoints: L.LatLng[]) {
    const routing = L.Routing.control({
      waypoints: waypoints
    }).addTo(this.map);

    routing.on('routesfound', (e) => {
      const distanceKm = e.routes[0].summary.totalDistance / 1000;
      const coords = e.routes[0].coordinates;

      let index = this.calculIndexArray(distanceKm, this.autonomyKm, coords.length);
      
      if (index != null) {
        
        const observables: Observable<any>[] = [];

        index.forEach((p: number) => {
          if (coords[p]) {
            observables.push(this.borneService.getBorne(coords[p].lat, coords[p].lng, 100000));
          }
        });

        zip(...observables).pipe(
          tap(value => {     
            const newWaypoints: any[] = [];
            newWaypoints.push(waypoints[0]);

            value.forEach(v => {
              newWaypoints.push(new L.LatLng(v.fields.ylatitude, v.fields.xlongitude))
            });

            newWaypoints.push(waypoints[1]);

            this.secondTraceRoute(newWaypoints, routing);
          })
        ).subscribe();
      
      } else {
        this.secondTraceRoute(waypoints, routing);
      }
    });
  }

  private secondTraceRoute(waypoints: L.LatLng[], routeToRemove: any) {
    this.route = L.Routing.control({
      waypoints: waypoints
    }).addTo(this.map);

    this.map.removeControl(routeToRemove);

    this.route.on('routesfound', (e: any) => {
      const d = e.routes[0].summary.totalDistance / 1000;
      const distanceKm = parseFloat(d.toFixed(1));
      
      const tempsRecharge = 0.5;
      const nbRecharge = waypoints.length-2;
      const vitesseKm = 100;

      this.apiservice.getprix(distanceKm);

      this.soapCalculService.calculDuration(distanceKm, vitesseKm, tempsRecharge, nbRecharge).pipe(
        tap(value => {
          this.infoService.setDuration(value);
          this.infoService.setDistance(distanceKm);
          this.infoService.setNbRecharge(nbRecharge);
        })
      ).subscribe();
      
    })
  }

  private calculIndexArray(distanceKm: number, autonomy: number, lengthCoords: number) {
    if (autonomy < distanceKm) {
      const nbReloads = distanceKm / autonomy;
      let index = (autonomy * lengthCoords) / distanceKm;
      index = index - 400;
      if (index < 0)
        index = 0;
      index = Math.floor(index);

      // Tableau index
      let arrayIndex: any = [];
      for (let i = 1; i <= nbReloads + 1; i++) {
        arrayIndex.push(index * i);
      }
      return arrayIndex;
    }
    return null;
  }


  private placeMarker(lat: number, lon: number) {
    L.marker(new L.LatLng(lat, lon)).addTo(this.map);
  }
}