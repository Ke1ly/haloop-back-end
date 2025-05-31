import { getElementById, querySelector } from "../utils/dom-utils.js";
import type {
  WorkPostFilterInput,
  Option,
  WorkPostForCardRender,
} from "../types/Work";
import Litepicker from "litepicker";
import "litepicker/dist/css/litepicker.css";
import { createDialogClickHandler } from "../utils/dialog-utils.js";

//獲得要呈現在頁面上的所有貼文資料
async function getWorkPosts(
  filter?: WorkPostFilterInput
): Promise<WorkPostForCardRender[]> {
  let workPostsData: WorkPostForCardRender[];
  if (!filter) {
    const response = await fetch("/api/works", {
      method: "GET",
    });
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    workPostsData = data.workPostData;
  } else {
    const queryString = toQueryString(filter);
    console.log(queryString);

    const response = await fetch(`/api/works?${queryString}`);
    if (!response.ok) throw new Error("Failed to fetch work posts");
    const data = await response.json();
    workPostsData = data.workPostData;
    // console.log(data);
    // console.log(data.workPostData);
  }
  return workPostsData;
}
//根據貼文資料進行渲染
async function renderWorkPosts(postsData: WorkPostForCardRender[]) {
  postsData.forEach((postData) => {
    const workPostTemplate =
      getElementById<HTMLTemplateElement>("work-post-template");
    const post = workPostTemplate.content.cloneNode(true) as DocumentFragment;

    const positionName = querySelector<HTMLElement>(post, ".position-name");
    if (positionName) {
      positionName.textContent = postData.positionName;
    } else {
      console.warn("Missing .position-name element in template");
    }

    const positionCategories = querySelector<HTMLElement>(
      post,
      ".position-categories"
    );
    if (positionCategories) {
      (postData.positionCategories as unknown as Option[]).forEach(
        (positionCategoryOption) => {
          let divTag = document.createElement("div");
          divTag.textContent = positionCategoryOption.name;
          positionCategories.appendChild(divTag);
        }
      );
    } else {
      console.warn("Missing .position-categories element in template");
    }

    const unitName = querySelector<HTMLElement>(post, ".unit-name");
    if (unitName) {
      unitName.textContent = postData.unit.unitName!;
      //UUU之後要檢查host要先填寫unitName才可發文
    } else {
      console.warn("Missing .unit-name element in template");
    }

    const avgWorkHours = querySelector<HTMLElement>(post, ".avg-work-hours");
    if (avgWorkHours) {
      avgWorkHours.textContent = `${postData.averageWorkHours}`;
    } else {
      console.warn("Missing .avg-work-hours element in template");
    }

    const minDuration = querySelector<HTMLElement>(post, ".min-stay-days");
    if (minDuration) {
      if (postData.minDuration == 0) {
        minDuration.textContent = "無限制";
      } else if (postData.minDuration == 7) {
        minDuration.textContent = "一週";
      } else if (postData.minDuration == 14) {
        minDuration.textContent = "兩週";
      } else if (postData.minDuration == 21) {
        minDuration.textContent = "三週";
      } else if (postData.minDuration == 30) {
        minDuration.textContent = "一個月";
      } else if (postData.minDuration == 60) {
        minDuration.textContent = "兩個月";
      } else if (postData.minDuration == 70) {
        minDuration.textContent = "兩個月以上";
      }
    } else {
      console.warn("Missing .min-stay-days element in template");
    }

    const accommodations = querySelector<HTMLElement>(post, ".accommodations");
    if (accommodations) {
      (postData.accommodations as unknown as Option[]).forEach(
        (accommodationOption) => {
          let divTag = document.createElement("div");
          divTag.textContent = accommodationOption.name;
          accommodations.appendChild(divTag);
        }
      );
    } else {
      console.warn("Missing .accommodations element in template");
    }

    const experiences = querySelector<HTMLElement>(post, ".experiences");
    if (experiences) {
      (postData.experiences as unknown as Option[]).forEach(
        (experienceOption) => {
          let divTag = document.createElement("div");
          divTag.textContent = experienceOption.name;
          experiences.appendChild(divTag);
        }
      );
    } else {
      console.warn("Missing .experiences element in template");
    }

    const environments = querySelector<HTMLElement>(post, ".environments");
    if (environments) {
      (postData.environments as unknown as Option[]).forEach(
        (experienceOption) => {
          let divTag = document.createElement("div");
          divTag.textContent = experienceOption.name;
          environments.appendChild(divTag);
        }
      );
    } else {
      console.warn("Missing .environments element in template");
    }

    const meals = querySelector<HTMLElement>(post, ".meals");
    if (meals) {
      (postData.meals as unknown as Option[]).forEach((experienceOption) => {
        let divTag = document.createElement("div");
        divTag.textContent = experienceOption.name;
        meals.appendChild(divTag);
      });
    } else {
      console.warn("Missing .meals element in template");
    }

    const imagesDiv = querySelector<HTMLElement>(post, ".work-post-images");
    if (imagesDiv) {
      postData.images.forEach((image) => {
        let imageUrl = image.imageUrl as string;
        // imageUrl = imageUrl as string;
        let imgTag = document.createElement("img");
        imgTag.src = imageUrl;
        imagesDiv.appendChild(imgTag);
      });
    } else {
      console.warn("Missing .work-post-images element in template");
    }

    const workPostSection = getElementById<HTMLElement>("work-list");
    workPostSection.appendChild(post);
  });
}
//初始化（取貼文資料、渲染貼文、渲染圖片）
async function initWorkPosts() {
  try {
    const postsData: WorkPostForCardRender[] = await getWorkPosts();
    console.log(postsData);
    await renderWorkPosts(postsData);
    renderSlides();
  } catch (error) {
    console.error("初始化失敗", error);
  }
}
initWorkPosts();

//初始化搜尋
function initFilter() {
  // 點擊篩選條件，跳出篩選視窗
  const filterBtn = getElementById<HTMLElement>("filter-search-btn");
  const filterDialog = getElementById<HTMLDialogElement>("filter-dialog");
  filterBtn.addEventListener("click", () => {
    filterDialog.showModal();
    filterDialog.classList.add("show");
  });
  filterDialog.addEventListener(
    "click",
    createDialogClickHandler(filterDialog)
  );

  // 多選按鈕的選取特效
  document
    .querySelectorAll<HTMLButtonElement>(".toggle-option")
    .forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("selected");
      });
    });

  // ＝＝＝＝＝＝＝＝＝＝＝＝點擊篩選＝＝＝＝＝＝＝＝＝＝＝＝
  const filterSearchBtn = getElementById<HTMLButtonElement>(
    "start-filter-search-btn"
  );
  filterSearchBtn.addEventListener("click", async () => {
    //取得並整理輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");
    let filter: WorkPostFilterInput = {
      applicantCount: getSelectNumberValue("applicant-count"),
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
      positionCategories: getSelectedOptionValues(
        ".position-category-option-btn"
      ),
      averageWorkHours: getSelectNumberValue("average-work-hours"),
      minDuration: getSelectNumberValue("min-stay-days"),
      accommodations: getSelectedOptionValues(".accommodation-option-btn"),
      meals: getSelectedOptionValues(".meal-option-btn"),
      experiences: getSelectedOptionValues(".experience-option-btn"),
      environments: getSelectedOptionValues(".environment-option-btn"),
    };
    console.log("由進階篩選送出的條件filter", filter);

    // getWorkPosts 將 filter 轉為 QueryString 重新發送 Get 貼文資料
    const postsData: WorkPostForCardRender[] = await getWorkPosts(filter);
    console.log("由進階篩選取得的postsData", postsData);

    //根據取得的結果，重新渲染頁面
    const workListSection = getElementById("work-list");
    workListSection.replaceChildren();
    renderWorkPosts(postsData);
    renderSlides();
  });

  // ＝＝＝＝＝＝＝＝＝＝＝＝點擊搜尋＝＝＝＝＝＝＝＝＝＝＝＝
  const searchBtn = getElementById<HTMLButtonElement>("search-btn");
  searchBtn.addEventListener("click", async () => {
    //取得並整理輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");

    let filter: WorkPostFilterInput = {
      applicantCount: getSelectNumberValue("applicant-count"),
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
    };
    console.log("由一般放大鏡送出的條件filter", filter);

    // getWorkPosts 將 filter 轉為 QueryString 重新發送 Get 貼文資料
    const postsData: WorkPostForCardRender[] = await getWorkPosts(filter);
    console.log("由一般放大鏡取得的postsData", postsData);

    //根據取得的結果，重新渲染頁面
    const workListSection = getElementById("work-list");
    workListSection.replaceChildren();
    renderWorkPosts(postsData);
    renderSlides();
  });
}
initFilter();

async function getCurrentUser() {
  const res = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  let data = await res.json(); // { id, email, role }
  // let data;
  // try {
  //   const text = await res.text();
  //   if (!text) {
  //     console.warn("Empty response body");
  //     return null;
  //   }
  //   data = JSON.parse(text);
  // } catch (err) {
  //   console.error("Failed to parse JSON:", err);
  //   return null;
  // }
  if (data.success) {
    console.log("userData", data);
    return data;
  } else {
    console.log("userData", data);
    return null;
  }
}
//初始化訂閱
async function initSubscription() {
  const filterSubscriptionBtn = getElementById<HTMLButtonElement>(
    "filter-subscription-btn"
  );
  let token = localStorage.getItem("token");
  console.log("token", token);
  if (!token || token == "undefined") {
    //UUU 這邊要檢查token為何是文字undefined
    filterSubscriptionBtn.style.display = "none";
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      if (userData.user.userType == "HELPER") {
        filterSubscriptionBtn.style.display = "inline-block";
      } else {
        filterSubscriptionBtn.style.display = "none";
      }
    } else {
      filterSubscriptionBtn.style.display = "none";
    }
  }

  //點擊訂閱
  filterSubscriptionBtn.addEventListener("click", async () => {
    //取得訂閱輸入資料
    const startDateStr = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDateStr = picker.getEndDate()?.format("YYYY-MM-DD");
    let filter: WorkPostFilterInput = {
      city: getSelectedCity(),
      startDate: startDateStr,
      endDate: endDateStr,
      applicantCount: getSelectNumberValue("applicant-count"),
      positionCategories: getSelectedOptionValues(
        ".position-category-option-btn"
      ),
      averageWorkHours: getSelectNumberValue("average-work-hours"),
      minDuration: getSelectNumberValue("min-stay-days"),
      accommodations: getSelectedOptionValues(".accommodation-option-btn"),
      meals: getSelectedOptionValues(".meal-option-btn"),
      experiences: getSelectedOptionValues(".experience-option-btn"),
      environments: getSelectedOptionValues(".environment-option-btn"),
    };
    console.log("01前端準備送出訂閱資料filter", filter);

    //將資料存入後端
    let filterSubscribeResponse = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(filter),
    });
    const filterSubscribeResponseData = await filterSubscribeResponse.json();
    console.log(
      "05前端獲得訂閱回傳filterSubscribeResponseData",
      filterSubscribeResponseData
    );
  });
}
initSubscription();

function toQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();

  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else {
      query.append(key, value);
    }
  }

  return query.toString();
}

//圖片左右切換
function renderSlides() {
  const imageContainers = document.querySelectorAll(".work-post-left");
  console.log(imageContainers);
  imageContainers.forEach((imageContainer) => {
    const track = imageContainer.querySelector(
      ".work-post-images"
    ) as HTMLElement;
    const images = track.querySelectorAll("img");
    console.log(images);
    if (images && images.length > 0) {
      const imageWidth = images[0].clientWidth;
      const prevBtn = imageContainer.querySelector(".right-arrow")!;
      const nextBtn = imageContainer.querySelector(".left-arrow")!;
      let currentIndex = 0;
      nextBtn.addEventListener("click", () => {
        console.log("nextBtn clicked");
        if (currentIndex < images.length - 1) {
          currentIndex++;
          track.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
        }
      });

      prevBtn.addEventListener("click", () => {
        console.log("prevBtn clicked");
        if (currentIndex > 0) {
          currentIndex--;
          track.style.transform = `translateX(-${currentIndex * imageWidth}px)`;
        }
      });
    }
  });
}

//取值 select 轉數字
function getSelectNumberValue(id: string): number {
  const el = document.getElementById(id);
  if (el && el instanceof HTMLSelectElement) {
    const value = el.value;
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      return num;
    }
  }
  return 0; // 預設值
}

//取值多選
function getSelectedOptionValues(selector: string): string[] {
  const result: string[] = [];
  const selectedButtons = document.querySelectorAll(`${selector}.selected`);

  selectedButtons.forEach((btn) => {
    const element = btn as HTMLElement;
    // const idStr = element.dataset.id;
    const name = element.dataset.value;
    if (name) {
      result.push(name);
    }
  });
  return result;
}

//取值城市 datalist
function getSelectedCity(): string | undefined {
  const input = document.getElementById("search-area") as HTMLInputElement;
  const dataList = document.getElementById(
    "search-area-list"
  ) as HTMLDataListElement;

  const inputValue = input.value;
  const options = dataList.options;

  for (let i = 0; i < options.length; i++) {
    if (options[i].value === inputValue) {
      return inputValue;
    }
  }

  return undefined; // 使用者輸入的值不在 datalist 中
}

//月曆設定
const picker = new Litepicker({
  element: document.getElementById("date-range") as HTMLInputElement,
  singleMode: false, // 啟用 range 模式
  numberOfMonths: 2, // 雙月視圖
  numberOfColumns: 2, // 雙欄（左月 / 右月）
  format: "YYYY-MM-DD", // 顯示格式
  minDate: new Date(), // 禁用過去
  autoApply: true, // 自動關閉
});

async function test() {
  const response = await fetch("api/subscribe", {
    method: "GET",
  });

  const data = await response.json();
  console.log("filterdata", data);
}
test();
