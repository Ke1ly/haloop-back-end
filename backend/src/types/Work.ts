export interface RawWorkPost {
  id: string;
  positionName: string;
  averageWorkHours: number;
  minDuration: number;
  recruitCount?: number;
  positionDescription?: string;
  benefitsDescription?: string;
  endDate?: Date;
  startDate?: Date;
  positionCategories: { name: string }[];
  accommodations: { name: string }[];
  meals: { name: string }[];
  experiences: { name: string }[];
  environments: { name: string }[];
  requirements?: { name: string }[];
  images: { imageUrl: string }[];
  unit: {
    id?: string;
    city: string;
    userId?: string;
    unitName?: string;
    latitude?: number | null;
    longitude?: number | null;
    // user?: { lastLoginAt: Date; createdAt: Date };
  };
}

export interface formattedWorkPost {
  id: string;
  positionName: string;
  averageWorkHours: number;
  minDuration: number;
  recruitCount?: number;
  positionDescription?: string;
  benefitsDescription?: string;
  endDate?: Date;
  startDate?: Date;
  positionCategories: string[];
  accommodations: string[];
  meals: string[];
  experiences: string[];
  environments: string[];
  requirements?: string[];
  images: string[];
  unit: {
    id?: string;
    city: string;
    userId?: string;
    unitName?: string;
    latitude?: number | null;
    longitude?: number | null;
    // user?: { lastLoginAt: Date; createdAt: Date };
  };
}

//routes/work.ts get / 搜尋輸入
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
