import { getElementById } from "../utils/dom-utils.js";
import { createDialogClickHandler } from "../utils/dialog-utils.js";

function initAuthUI() {
  // 角色按鈕樣式
  const signUpRoleButtons = document.querySelectorAll(".sign-up-role");
  const signInRoleButtons = document.querySelectorAll(".sign-in-role");
  [signUpRoleButtons, signInRoleButtons].forEach((btns) => {
    btns.forEach((button) => {
      button.addEventListener("click", () => {
        btns.forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
  });

  // 角色按鈕取值函式
  function getSelectedBtnValue(selector: string): string {
    const selectedButton = document.querySelector(`${selector}.selected`);
    const element = selectedButton as HTMLElement | null;
    return element?.dataset.value || "";
  }

  // 點擊註冊按鈕，跳出表單
  const toSignUpDiv = getElementById<HTMLDivElement>("sign-up-div");
  // const toSignUpBtn = getElementById<HTMLButtonElement>("sign-up-btn");
  const signUpDialog = getElementById<HTMLDialogElement>("sign-up-dialog");
  toSignUpDiv.addEventListener("click", () => {
    signUpDialog.showModal();
    signUpDialog.classList.add("show");
  });

  // 點擊登入按鈕，跳出表單
  const toSignInDiv = getElementById<HTMLDivElement>("sign-in-div");
  const signInDialog = getElementById<HTMLDialogElement>("sign-in-dialog");
  toSignInDiv.addEventListener("click", () => {
    signInDialog.showModal();
    signInDialog.classList.add("show");
  });

  //點擊周邊區域，關閉登入或註冊表單
  signUpDialog.addEventListener(
    "click",
    createDialogClickHandler(signUpDialog)
  );
  signInDialog.addEventListener(
    "click",
    createDialogClickHandler(signInDialog)
  );

  // 註冊 submit
  getElementById<HTMLFormElement>("sign-up-form").addEventListener(
    "submit",
    async (event: Event) => {
      event.preventDefault();
      // 重置回應訊息
      const signUpResponse = getElementById<HTMLParagraphElement>(
        "sign-up-response-message"
      );
      signUpResponse.replaceChildren();

      // 取得註冊資料
      const email = getElementById<HTMLInputElement>("sign-up-email").value;
      const password =
        getElementById<HTMLInputElement>("sign-up-passsword").value;
      const username =
        getElementById<HTMLInputElement>("sign-up-username").value;
      const realname =
        getElementById<HTMLInputElement>("sign-up-realname").value;
      const userType = getSelectedBtnValue(".sign-up-role");
      console.log({ email, password, username, realname, userType });

      // 驗證註冊資料
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!username || !realname || !email || !password || !userType) {
        renderResponseMessage(signUpResponse, "請填打所有欄位", "red");
      } else if (!re.test(email)) {
        renderResponseMessage(signUpResponse, "請輸入正確的電子郵件", "red");
      }

      // fetch 後端，寫入註冊資料
      let response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          realname,
          email,
          password,
          userType,
        }),
      });

      if (!response.ok) {
        let errorData = await response.json();
        renderResponseMessage(
          signUpResponse,
          errorData.message || "註冊時發生錯誤",
          "red"
        );
        throw new Error(errorData.message || "註冊時發生錯誤");
      }
      const signUpData = await response.json();
      if (signUpData.success) {
        localStorage.setItem("token", signUpData.token);
        renderResponseMessage(signUpResponse, "註冊成功", "green");
        console.log("註冊成功:", signUpData);
      } else {
        alert(signUpData.message);
      }
    }
  );

  function renderResponseMessage(
    area: HTMLParagraphElement,
    msg: string,
    color: string
  ) {
    area.textContent = msg;
    area.style.color = color;
    area.style.marginBottom = "10px";
  }

  // 登入 submit
  getElementById<HTMLFormElement>("sign-in-form").addEventListener(
    "submit",
    async (event: Event) => {
      event.preventDefault();
      // 重置回應訊息
      const signInResponse = getElementById<HTMLParagraphElement>(
        "sign-in-response-message"
      );
      signInResponse.replaceChildren();

      // 取得登入資料
      const email = getElementById<HTMLInputElement>("sign-in-email").value;
      const password =
        getElementById<HTMLInputElement>("sign-in-password").value;
      const userType = getSelectedBtnValue(".sign-in-role");
      console.log({ email, password, userType });

      // 驗證登入資料
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !password || !userType) {
        renderResponseMessage(signInResponse, "請填打所有欄位", "red");
      } else if (!re.test(email)) {
        renderResponseMessage(signInResponse, "請輸入正確的電子郵件", "red");
      }

      // fetch 後端，寫入登入資料
      let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        let errorData = await response.json();
        renderResponseMessage(
          signInResponse,
          "登入時發生錯誤",
          errorData.message
        );
        throw new Error(errorData.message || "登入時發生錯誤");
      }
      const signInData = await response.json();

      if (signInData.success) {
        localStorage.setItem("token", signInData.token);
        renderResponseMessage(signInResponse, "登入成功", "green");
        console.log("登入成功:", signInData);
        location.reload();
      } else {
        alert(signInData.message);
      }
    }
  );
}

function loginUI() {
  //登出
  const logOutBtns = document.querySelectorAll(".log-out-btn");
  logOutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("logOutBtns");
      localStorage.removeItem("token");
      location.reload();
    });
  });
  //nav前往帳號頁
  const accountBtns = document.querySelectorAll<HTMLButtonElement>(
    ".account-management-btn"
  );
  accountBtns.forEach((accountBtn) => {
    accountBtn.onclick = () => {
      window.location.assign("./account");
    };
  });
}

//用 token 取得當前使用者資訊
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

async function initApp() {
  let token = localStorage.getItem("token");
  console.log(token);
  if (!token || token == "undefined") {
    //UUU 這邊要檢查token為何是文字undefined
    renderMenu(null);
    initAuthUI();
  } else {
    const userData = await getCurrentUser();
    if (userData) {
      renderMenu(userData.user.userType);
      loginUI();
      if (userData.user.userType == "HELPER") {
        sse(userData.user.id);
      }
    } else {
      renderMenu(null);
      initAuthUI();
    }
  }
}
initApp();

// 根據角色渲染 menu
function renderMenu(UserType: any) {
  const visitorMenu = document.getElementById("visitor-menu")!;
  const helperMenu = document.getElementById("helper-menu")!;
  const hostMenu = document.getElementById("host-menu")!;
  const showMenuBtn = getElementById<HTMLButtonElement>("show-menu-btn");
  if (UserType == "HELPER") {
    // hostMenu.style.display = "none";
    // helperMenu.style.display = "none";
    // visitorMenu.style.display = "none";
    //UUU這邊上面好像不需要，一開始不要跳出block，等click再跳出
    showMenuBtn.addEventListener("click", () => {
      if (helperMenu.style.display == "block") {
        helperMenu.style.display = "none";
      } else {
        helperMenu.style.display = "block";
      }
    });
  } else if (UserType == "HOST") {
    // hostMenu.style.display = "none";
    // helperMenu.style.display = "none";
    // visitorMenu.style.display = "none";
    showMenuBtn.addEventListener("click", () => {
      if (hostMenu.style.display == "block") {
        hostMenu.style.display = "none";
      } else {
        hostMenu.style.display = "block";
      }
    });
  } else {
    // hostMenu.style.display = "none";
    // helperMenu.style.display = "none";
    // visitorMenu.style.display = "none";
    showMenuBtn.addEventListener("click", () => {
      if (visitorMenu.style.display == "block") {
        visitorMenu.style.display = "none";
      } else {
        visitorMenu.style.display = "block";
      }
    });
  }
}

const notificationBtn = document.querySelector(".fa-bell") as HTMLElement;
const notificationList = document.getElementById(
  "notification-list"
) as HTMLElement;
notificationBtn.addEventListener("click", () => {
  if (notificationList.style.display == "block") {
    notificationList.style.display = "none";
  } else {
    notificationList.style.display = "block";
  }
});

// 根據角色連結 SSE
function sse(helperId: number) {
  const eventSource = new EventSource(`/api/notification/stream/${helperId}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const list = document.getElementById("notification-list");
    const count = document.getElementById("notification-count");

    const item = document.createElement("div");
    item.innerText = data.message;
    list?.appendChild(item);

    const current = parseInt(count?.innerText || "0");
    count!.innerText = (current + 1).toString();
  };
}

// document
//   .getElementById("notification-icon")
//   ?.addEventListener("mouseover", () => {
//     document.getElementById("notification-list")!.style.display = "block";
//   });
