// 用於 WorkPost發文 api/works/post
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

// 用於 WorkPost取得 api/works/get
export interface WorkPostForCardRender {
  id: string;
  images: string[];
  positionName: string;
  positionCategories: string[];
  averageWorkHours: number;
  minDuration: number;
  accommodations: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  unit: {
    id: string;
    city: string;
    unitName: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface WorkPostForPageRender {
  id: string;
  startDate: Date;
  endDate: Date;
  recruitCount: number;
  images: string[];
  positionName: string;
  positionDescription: string;
  positionCategories: string[];
  averageWorkHours: number;
  minDuration: number;
  accommodations: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  requirements: string[];
  benefitsDescription: string;
  unit: {
    id: string;
    userId: string;
    city: string;
    district?: string;
    address: string;
    unitName: string;
    unitDescription?: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
  };
}

//positionName是給通知用的，/post/works時與/get/subsription/recommendations時使用
export interface WorkPostForFilter {
  id: string;
  startDate: Date;
  endDate: Date;
  recruitCount: number;
  averageWorkHours: number;
  minDuration: number;
  experiences: string[];
  environments: string[];
  accommodations: string[];
  meals: string[];
  positionCategories: string[];
  unit: {
    city: string;
  };
  positionName: string;
}

// 計算recommendations的函式用 get /api/subscription/recommendations
export interface WorkPostForRecommendation {
  id: string;
  startDate: Date;
  endDate: Date;
  recruitCount: number;
  averageWorkHours: number;
  minDuration: number;
  experiences: string[];
  environments: string[];
  accommodations: string[];
  meals: string[];
  images: string[];
  positionCategories: string[];
  unit: {
    city: string;
    unitName: string;
  };
  positionName: string;
}

export interface ScoredPost {
  post: WorkPostForRecommendation;
  score: number;
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

//用於取得幫手的搜尋訂閱 api/works/post
export interface FilterSubscription {
  name?: string | null;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  applicantCount?: number | null;
  averageWorkHours?: number | null;
  minDuration?: number | null;
  positionCategories?: string[];
  accommodations?: string[];
  meals?: string[];
  experiences?: string[];
  environments?: string[];
}
export interface Subscription {
  helperProfileId: string;
  filters: FilterSubscription;
}
