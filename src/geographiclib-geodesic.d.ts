declare module 'geographiclib-geodesic' {
  interface InverseResult { s12: number; azi1: number; }
  interface PositionResult { lat2: number; lon2: number; }
  interface GeodesicLine { Position(distance: number): PositionResult; }
  const library: {
    Geodesic: {
      WGS84: {
        Inverse(lat1: number, lon1: number, lat2: number, lon2: number): InverseResult;
        Line(lat: number, lon: number, azi: number): GeodesicLine;
      };
    };
  };
  export default library;
}
