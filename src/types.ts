export type Language = 'en' | 'es';
export type Mode = 'tallest' | 'iconic';
export type ReviewStatus = 'candidate' | 'researched' | 'approved';
export type Confidence = 'high' | 'medium' | 'low';

export interface City {
  city_id: string;
  city_name_en: string;
  city_name_es: string;
  city_name_local: string;
  country_code: string;
  country_name_en: string;
  country_name_es: string;
  continent: string;
  region: string;
  coverage_frame: 'population_core' | 'regional_balance';
  population_source_id: string;
  review_status: ReviewStatus;
  reviewed_at: string;
}

export interface Airport {
  airport_id: string;
  airport_name: string;
  airport_name_es: string;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
  airport_type: string;
  coordinate_source_id: string;
  reviewed_at: string;
}

export interface CityAirport {
  city_id: string;
  airport_id: string;
  include: boolean;
  primary_airport: boolean;
  airport_order: number;
  service_pattern: 'year_round' | 'seasonal';
  qualifying_service_as_of: string;
  association_source_id: string;
  service_source_id: string;
  inclusion_reason_en: string;
  inclusion_reason_es: string;
  review_status: ReviewStatus;
}

export interface Tower {
  tower_id: string;
  tower_name: string;
  tower_name_es: string;
  latitude: number;
  longitude: number;
  height_m: number;
  height_basis: 'structural_tip' | 'architectural_top';
  tower_type: string;
  completed_year: number;
  completion_status: 'completed';
  coordinate_source_id: string;
  height_source_id: string;
}

export interface CityTower {
  city_id: string;
  tower_id: string;
  tallest_eligible: boolean;
  iconic_candidate: boolean;
  association_source_id: string;
  disqualification_reason: string;
  review_status: ReviewStatus;
}

export interface TowerSelection {
  city_id: string;
  mode: Mode;
  tower_id: string;
  co_tallest: boolean;
  selection_reason_en: string;
  selection_reason_es: string;
  confidence: Confidence;
  selection_source_id: string;
  reviewer: string;
  reviewed_at: string;
}

export interface SourceRecord {
  source_id: string;
  publisher: string;
  title: string;
  url: string;
  accessed_at: string;
  source_type: string;
  licence_note: string;
}

export interface Observation {
  observation_id: string;
  city_id: string;
  city_name_en: string;
  city_name_es: string;
  city_name_local: string;
  country_code: string;
  country_name_en: string;
  country_name_es: string;
  continent: string;
  region: string;
  airport_id: string;
  airport_name: string;
  airport_name_es: string;
  iata: string;
  icao: string;
  airport_latitude: number;
  airport_longitude: number;
  airport_type: string;
  primary_airport: boolean;
  service_pattern: 'year_round' | 'seasonal';
  tower_id: string;
  tower_name: string;
  tower_name_es: string;
  tower_latitude: number;
  tower_longitude: number;
  height_m: number;
  height_basis: string;
  tower_type: string;
  completed_year: number;
  mode: Mode;
  co_tallest: boolean;
  confidence: Confidence;
  selection_reason_en: string;
  selection_reason_es: string;
  distance_m: number;
  distance_km: number;
  source_ids: string[];
  reviewed_at: string;
}

export interface Metadata {
  release_id: string;
  release_status: 'research_preview' | 'publication_ready';
  generated_at: string;
  review_cutoff: string;
  methodology_version: string;
  city_count: number;
  airport_count: number;
  tower_count: number;
  observation_count: number;
  mode_counts: Record<Mode, number>;
  low_confidence_selection_count: number;
  candidate_selection_count: number;
  source_snapshot: string;
}
