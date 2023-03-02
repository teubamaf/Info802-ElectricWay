import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import('leaflet-routing-machine');
import { Observable, tap, zip } from 'rxjs';
import { MapService } from 'app/services/map.service';
import { BornesService } from 'app/services/bornes.service';

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

  constructor(private mapService: MapService , private borneService : BornesService) { }

  ngOnInit(): void {
    this.initMap();

    this.startCities$ = this.mapService.startCities$;
    this.destCities$ = this.mapService.destCities$;
  }

  private firstTraceRoute(waypoints: L.LatLng[]) {
    const routing = L.Routing.control({
      waypoints: waypoints
    }).addTo(this.map);

    routing.on('routesfound', (e) => {
      const distanceKm = e.routes[0].summary.totalDistance / 1000;
      const coords = e.routes[0].coordinates;
      const autonomyKm = 500;

      // we calcul when we need electric power
      let index = this.calculIndexArray(distanceKm, autonomyKm, coords.length);
      
      // if we need it on the road
      if (index != null) {
        const observables: Observable<any>[] = [];

        // for each, we want to find the nearest charging point
        index.forEach((p: number) => {
          if (coords[p]) {
            // we add all the query in an array to send them at the same time
            observables.push(this.borneService.getBorne(coords[p].lat, coords[p].lng, 100000));
          }
        });

        // send all the query
        zip(...observables).pipe(
          tap(value => {
            // we create a new route form start to dest passing through charging point            
            const newWaypoints: any[] = [];
            newWaypoints.push(waypoints[0]);

            value.forEach(v => {
              newWaypoints.push(new L.LatLng(v.fields.ylatitude, v.fields.xlongitude))
            });

            newWaypoints.push(waypoints[1]);

            // trace new route and delete old route
            this.secondTraceRoute(newWaypoints, routing);
          })
        ).subscribe();
      }
    });
  }

  private secondTraceRoute(waypoints: L.LatLng[], routeToRemove: any) {
    // trace new route
    const routing = L.Routing.control({
      waypoints: waypoints
    }).addTo(this.map);

    // delete old route
    this.map.removeControl(routeToRemove);

    routing.on('routesfound', (e) => {
      const distanceKm = e.routes[0].summary.totalDistance / 1000;
          
      console.log('distanceKm : ' + distanceKm);
    })
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

  calculIndexArray(distanceKm: number, autonomy: number, lengthCoords: number) {
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

  onSubmitForm() {
    
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

}