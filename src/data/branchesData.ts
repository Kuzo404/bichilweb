export interface Phone {
  id: number;
  phone: string;
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  image: string;
  image_url: string;
  area: string;
  city: string;
  district: string;
  open: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: Phone[];
}
