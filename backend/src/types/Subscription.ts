import { RawWorkPost, formattedWorkPost } from "./Work.js";

//subscription POST / request.body
export interface BaseFilter {
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

export interface FilterInput extends BaseFilter {
  name?: string | null;
}

//subscription POST / 建立的 data 與回傳值，GET / 回傳值
export interface BaseSubscription {
  id?: string;
  name: string | null;
  helperProfileId?: string;
  city?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  applicantCount?: number | null;
  averageWorkHours?: number | null;
  minDuration?: number | null;
  positionCategories?: string[];
  accommodations?: string[];
  meals?: string[];
  experiences?: string[];
  environments?: string[];
  filters: BaseFilter;
}

//subscription GET /matched-posts 回傳值
export interface MatchedWorkPost {
  workPost: RawWorkPost;
}

export interface ScoredPost {
  post: WorkPostDocument;
  score: number;
}

//ES Document
export interface WorkPostDocument {
  id: string;
  startDate: string;
  endDate: string;
  averageWorkHours: number;
  minDuration: number;
  recruitCount: number;
  positionCategories: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  accommodations: string[];
  unit: {
    city: string;
  };
}

// queue.ts ES getMatchingSubscriptions 查詢結果
export interface MatchResult {
  helperId: string;
  subscriptionId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  // data: {
  //   workPostId: string;
  //   unitName: string;
  //   positionName: string;
  // };
  data?: any;
  createdAt?: Date;
  isRead?: boolean;
  timestamp?: string;
}
