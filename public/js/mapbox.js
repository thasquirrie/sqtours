console.log('Angel smile with those devilish eyes');

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoidGhhc3F1aXJyaWUiLCJhIjoiY2tkOTBvdWV6MGk3czM0b2RuNjl0a2ZtZSJ9.b7TIlzefnl0awSnJetBLig';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/thasquirrie/ckd91gj720x041it3b2wsdr7a',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    const el = document.createElement('div');
    el.className = 'marker';

    // Create marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
