export function displaMap(locations) {
  const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: false,
    dragging: true,
  });

  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }
  ).addTo(map);

  var greenIcon = L.icon({
    iconUrl: '/img/pin.png',
    iconSize: [20, 25],
    iconAnchor: [10, 25],
    popupAnchor: [0, -30],
  });

  const points = [];

  locations.forEach((loc) => {
    const latlng = [loc.coordinates[1], loc.coordinates[0]];
    points.push(latlng);

    L.marker(latlng, { icon: greenIcon })
      .addTo(map)
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        className: 'mapPopup',
      })
      .on('mouseover', function () {
        this.openPopup();
      })
      .on('mouseout', function () {
        this.closePopup();
      })
      .openPopup();
  });

  const bounds = L.latLngBounds(points);

  map.fitBounds(bounds, {
    padding: [30, 30],
    maxZoom: 15,
  });
}
