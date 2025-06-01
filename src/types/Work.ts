// export interface WorkPostInput {
//   // unitName: string;
//   // address: string;
//   // unitDescription: string;
//   startDate: string;
//   endDate: string;
//   recruitCount: number;
//   imageUrls: string[];
//   positionName: string;
//   positionCategories: Option[];
//   averageWorkHours: number;
//   minDuration: number;
//   requirements: Option[];
//   positionDescription: string;
//   accommodations: Option[];
//   meals: Option[];
//   experiences: Option[];
//   environments: Option[];
//   benefitsDescription: string;
// }

// WorkPost發文(post)
export interface WorkPost {
  startDate: string;
  endDate: string;
  recruitCount: number;
  images: string[];
  positionName: string;
  positionCategories: string[];
  averageWorkHours: number;
  minDuration: number;
  requirements: string[];
  positionDescription: string;
  accommodations: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  benefitsDescription: string;
}
export interface Image {
  id: string;
  imageUrl: string;
}
// WorkPost回應(get)
export interface WorkPostForCardRender {
  startDate: string;
  endDate: string;
  recruitCount: number;
  images: Image[];
  positionName: string;
  positionCategories: Option[];
  averageWorkHours: number;
  minDuration: number;
  requirements: Option[];
  positionDescription: string;
  accommodations: Option[];
  meals: Option[];
  experiences: Option[];
  environments: Option[];
  benefitsDescription: string;
  unit: HostProfileResponse;
}

// export interface WorkPostForFilter {
//   startDate: string;
//   endDate: string;
//   recruitCount: number;
//   positionCategories: Option[];
//   averageWorkHours: number;
//   minDuration: number;
//   requirements: Option[];
//   accommodations: Option[];
//   meals: Option[];
//   experiences: Option[];
//   environments: Option[];
// }

export interface WorkPostForFilter {
  unit: {
    city: string;
  };
  startDate: Date;
  endDate: Date;
  recruitCount: number;
  averageWorkHours: number;
  minDuration: number;
  positionCategories: Option[];
  accommodations: Option[];
  meals: Option[];
  experiences: Option[];
  environments: Option[];
}

export interface Option {
  id: number;
  name: string;
}

//幫手的搜尋輸入
export interface WorkPostFilterInput {
  city?: string;
  startDate?: string;
  endDate?: string;
  applicantCount?: number;
  positionCategories?: string[];
  averageWorkHours?: number;
  minDuration?: number;
  accommodations?: string[];
  meals?: string[];
  experiences?: string[];
  environments?: string[];
}

//取得幫手的搜尋訂閱
export interface FilterSubscription {
  name?: string | null;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicantCount?: number | null;
  positionCategories?: Option[];
  averageWorkHours?: number;
  minDuration?: number | null;
  accommodations?: Option[];
  meals?: Option[];
  experiences?: Option[];
  environments?: Option[];
  filters?: Option[];
}

export interface Subscription {
  helperProfileId: string;
  filters: FilterSubscription;
}

export interface HostProfileResponse {
  userId?: string;
  unitName?: string;
  address?: string;
  city?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
