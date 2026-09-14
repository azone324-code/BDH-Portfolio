const { createClient } = window.supabase;


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_READY =
  window.BDH_SUPABASE_URL &&
  !window.BDH_SUPABASE_URL.includes("YOUR-PROJECT") &&
  window.BDH_SUPABASE_ANON_KEY &&
  !window.BDH_SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");


const sb = SUPABASE_READY
  ? createClient(
      window.BDH_SUPABASE_URL,
      window.BDH_SUPABASE_ANON_KEY
    )
  : null;



/* =========================================================
   FALLBACK DATA
========================================================= */

const fallback = {

  tagline:
    "A creative home for Bengali fan dubbing, voice artists and storytellers.",

  facebook:
    "https://www.facebook.com/BanglaDubHubOfficial/",

  logo_url:
    "assets/bdh-logo.jpg"

};



/* =========================================================
   GLOBAL DATA
========================================================= */

let site = {
  ...fallback
};

let admins = [];

let members = [];

let works = [];

let session = null;

let isAdmin = false;



/* =========================================================
   HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);



function esc(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll('"', "&quot;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;");

}



function safeUrl(value = "") {

  try {

    const url =
      new URL(value, location.href);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {

      return url.href;

    }

    return "#";

  } catch {

    return "#";

  }

}



function pic(src, alt = "") {

  if (!src) {

    return `<div class="pic">PHOTO</div>`;

  }


  return `

    <div class="pic">

      <img
        src="${esc(src)}"
        alt="${esc(alt)}"
        loading="lazy">

    </div>

  `;

}



/* =========================================================
   MODAL
========================================================= */

function openModal(content) {

  const modal =
    $("#modal");

  const contentBox =
    $("#modalContent");


  if (!modal || !contentBox)
    return;


  contentBox.innerHTML =
    content;


  modal.classList.remove("hidden");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

}



function closeModal() {

  const modal =
    $("#modal");


  if (!modal)
    return;


  modal.classList.add("hidden");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

}



/* =========================================================
   LOAD PUBLIC DATA
========================================================= */

async function loadPublic() {

  if (!sb) {

    site = {
      ...fallback
    };

    admins = [];

    members = [];

    works = [];

    render();

    return;

  }


  try {

    const [

      settingsResult,

      adminsResult,

      membersResult,

      worksResult

    ] = await Promise.all([


      sb
        .from("site_settings")
        .select(
          "tagline,facebook,logo_url"
        )
        .eq("id", 1)
        .maybeSingle(),


      sb
        .from("admins")
        .select(
          "id,name,role,bio,photo_url,facebook,instagram"
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        ),


      sb
        .from("members")
        .select(
          "id,name,role,bio,photo_url,facebook,instagram,videos"
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        ),


      sb
        .from("works")
        .select(
          "id,title,type,url"
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        )

    ]);


    if (settingsResult.error) {

      console.warn(
        "Site settings error:",
        settingsResult.error
      );

    }

    else if (settingsResult.data) {

      site = {
        ...fallback,
        ...settingsResult.data
      };

    }


    admins =
      adminsResult.error
        ? []
        : (
            adminsResult.data || []
          );


    members =
      membersResult.error
        ? []
        : (
            membersResult.data || []
          );


    works =
      worksResult.error
        ? []
        : (
            worksResult.data || []
          );


    render();


  } catch (error) {

    console.error(
      "loadPublic error:",
      error
    );

    render();

  }

}



/* =========================================================
   RENDER
========================================================= */

function render() {

  const tagline =
    $("#tagline");

  const fbContact =
    $("#fbContact");

  const siteLogo =
    $("#siteLogo");

  const brandLogo =
    $("#brandLogo");


  if (tagline) {

    tagline.textContent =
      site.tagline ||
      fallback.tagline;

  }


  if (fbContact) {

    fbContact.href =
      safeUrl(
        site.facebook ||
        fallback.facebook
      );

    fbContact.target =
      "_blank";

    fbContact.rel =
      "noopener noreferrer";

  }


  const logo =
    site.logo_url ||
    fallback.logo_url;


  if (siteLogo)
    siteLogo.src = logo;


  if (brandLogo)
    brandLogo.src = logo;



  /* ================= ADMINS ================= */

  const adminGrid =
    $("#adminGrid");


  if (adminGrid) {

    adminGrid.innerHTML =
      admins.length

        ? admins
            .map(
              (admin) => `

                <article
                  class="card"
                  onclick="viewAdmin('${admin.id}')">

                  ${pic(
                    admin.photo_url,
                    admin.name
                  )}

                  <div class="card-body">

                    <h3>
                      ${esc(admin.name)}
                    </h3>

                    <p class="role">
                      ${esc(admin.role || "Admin")}
                    </p>

                    <p>
                      ${esc(
                        admin.bio || ""
                      )}
                    </p>

                  </div>

                </article>

              `
            )
            .join("")

        : emptyCard(
            "Admin profiles will appear here."
          );

  }



  /* ================= MEMBERS ================= */

  const memberGrid =
    $("#memberGrid");


  if (memberGrid) {

    memberGrid.innerHTML =
      members.length

        ? members
            .map(
              (member) => `

                <article
                  class="card"
                  onclick="viewMember('${member.id}')">

                  ${pic(
                    member.photo_url,
                    member.name
                  )}

                  <div class="card-body">

                    <h3>
                      ${esc(member.name)}
                    </h3>

                    <p class="role">
                      ${esc(
                        member.role ||
                        "Voice Artist"
                      )}
                    </p>

                    <p>
                      ${esc(
                        member.bio || ""
                      )}
                    </p>

                  </div>

                </article>

              `
            )
            .join("")

        : emptyCard(
            "Member profiles will appear here."
          );

  }



  /* ================= WORKS ================= */

  const workGrid =
    $("#workGrid");


  if (workGrid) {

    workGrid.innerHTML =
      works.length

        ? works
            .map(
              (work) => `

                <article class="card work-card">

                  <div class="card-body">

                    <p class="role">
                      ${esc(
                        work.type || "Project"
                      )}
                    </p>

                    <h3>
                      ${esc(work.title)}
                    </h3>

                    ${
                      work.url

                        ? `

                          <a
                            class="btn small"
                            href="${safeUrl(work.url)}"
                            target="_blank"
                            rel="noopener noreferrer">

                            Watch / View ↗

                          </a>

                        `

                        : ""

                    }

                  </div>

                </article>

              `
            )
            .join("")

        : emptyCard(
            "Featured works will appear here."
          );

}



function emptyCard(text) {

  return `

    <article class="card empty">

      <div class="card-body">

        <p>
          ${esc(text)}
        </p>

      </div>

    </article>

  `;

}



/* =========================================================
   VIEW ADMIN
========================================================= */

function viewAdmin(id) {

  const admin =
    admins.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!admin)
    return;


  openModal(`

    <div class="profile-view">

      ${pic(
        admin.photo_url,
        admin.name
      )}

      <h2>
        ${esc(admin.name)}
      </h2>

      <p class="role">
        ${esc(
          admin.role || "Admin"
        )}
      </p>

      <p>
        ${esc(admin.bio || "")}
      </p>

      <div class="social-links">

        ${
          admin.facebook

            ? `
              <a
                href="${safeUrl(admin.facebook)}"
                target="_blank"
                rel="noopener noreferrer">

                Facebook

              </a>
            `

            : ""
        }


        ${
          admin.instagram

            ? `
              <a
                href="${safeUrl(admin.instagram)}"
                target="_blank"
                rel="noopener noreferrer">

                Instagram

              </a>
            `

            : ""
        }

      </div>

    </div>

  `);

}



/* =========================================================
   VIEW MEMBER
========================================================= */

function viewMember(id) {

  const member =
    members.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!member)
    return;


  let videos = [];


  if (Array.isArray(member.videos)) {

    videos =
      member.videos;

  }

  else if (
    typeof member.videos ===
    "string"
  ) {

    try {

      videos =
        JSON.parse(
          member.videos
        );

    } catch {

      videos = [];

    }

  }


  const videoHtml =
    videos.length

      ? videos
          .map(
            (video) => `

              <a
                class="btn small"
                href="${safeUrl(video)}"
                target="_blank"
                rel="noopener noreferrer">

                Watch Work ↗

              </a>

            `
          )
          .join("")

      : `<p>No work videos added yet.</p>`;


  openModal(`

    <div class="profile-view">

      ${pic(
        member.photo_url,
        member.name
      )}

      <h2>
        ${esc(member.name)}
      </h2>

      <p class="role">
        ${esc(
          member.role ||
          "Voice Artist"
        )}
      </p>

      <p>
        ${esc(member.bio || "")}
      </p>


      <div class="social-links">

        ${
          member.facebook

            ? `
              <a
                href="${safeUrl(member.facebook)}"
                target="_blank"
                rel="noopener noreferrer">

                Facebook

              </a>
            `

            : ""
        }


        ${
          member.instagram

            ? `
              <a
                href="${safeUrl(member.instagram)}"
                target="_blank"
                rel="noopener noreferrer">

                Instagram

              </a>
            `

            : ""
        }

      </div>


      <hr>


      <h3>
        Works
      </h3>


      <div class="social-links">

        ${videoHtml}

      </div>

    </div>

  `);

}



/* =========================================================
   ADMIN EXISTS
========================================================= */

async function adminExists() {

  if (!sb)
    return false;


  const {
    count,
    error
  } = await sb
    .from("admins")
    .select(
      "id",
      {
        count: "exact",
        head: true
      }
    );


  if (error) {

    console.error(
      "adminExists:",
      error
    );

    return false;

  }


  return (count || 0) > 0;

}



/* =========================================================
   OPEN ADMIN
========================================================= */

async function openAdmin() {

  if (!sb) {

    openModal(`

      <div class="admin-view">

        <h2>
          Admin Panel
        </h2>

        <p>
          Supabase is not configured yet.
        </p>

        <p>
          Please check
          <strong>
            supabase-config.js
          </strong>.
        </p>

      </div>

    `);

    return;

  }


  if (session) {

    isAdmin = true;

    adminPanel();

    return;

  }


  const exists =
    await adminExists();


  if (exists) {

    loginView();

  }

  else {

    setupView();

  }

}



/* =========================================================
   LOGIN VIEW
========================================================= */

function loginView() {

  openModal(`

    <div class="admin-view">

      <h2>
        BDH Admin Login
      </h2>

      <p>
        Sign in to manage the website.
      </p>


      <form
        onsubmit="doLogin(event)">

        <input
          id="loginEmail"
          type="email"
          placeholder="Email"
          required>


        <input
          id="loginPassword"
          type="password"
          placeholder="Password"
          required>


        <button
          class="btn"
          type="submit">

          Login

        </button>

      </form>

    </div>

  `);

}



/* =========================================================
   LOGIN
========================================================= */

async function doLogin(event) {

  event.preventDefault();


  const email =
    $("#loginEmail").value.trim();


  const password =
    $("#loginPassword").value;


  try {

    const {
      data,
      error
    } = await sb.auth.signInWithPassword({

      email,
      password

    });


    if (error)
      throw error;


    session =
      data.session;


    isAdmin = true;


    closeModal();

    adminPanel();


  } catch (error) {

    alert(
      error.message ||
      "Login failed."
    );

  }

}



/* =========================================================
   FIRST ADMIN SETUP
========================================================= */

function setupView() {

  openModal(`

    <div class="admin-view">

      <h2>
        Create BDH Admin
      </h2>

      <p>
        No admin account was found.
        Create the first admin account.
      </p>


      <form
        onsubmit="doSetup(event)">


        <input
          id="setupName"
          type="text"
          placeholder="Your Name"
          required>


        <input
          id="setupEmail"
          type="email"
          placeholder="Email"
          required>


        <input
          id="setupPassword"
          type="password"
          placeholder="Password"
          minlength="8"
          required>


        <input
          id="setupConfirm"
          type="password"
          placeholder="Confirm Password"
          minlength="8"
          required>


        <button
          class="btn"
          type="submit">

          Create Admin

        </button>

      </form>

    </div>

  `);

}



/* =========================================================
   DO SETUP
========================================================= */

async function doSetup(event) {

  event.preventDefault();


  const name =
    $("#setupName").value.trim();


  const email =
    $("#setupEmail").value.trim();


  const password =
    $("#setupPassword").value;


  const confirm =
    $("#setupConfirm").value;


  if (
    !name ||
    !email ||
    password.length < 8 ||
    password !== confirm
  ) {

    alert(
      "Please enter valid information and make sure the passwords match."
    );

    return;

  }


  try {

    const {
      data,
      error
    } = await sb.auth.signUp({

      email,

      password

    });


    if (error)
      throw error;


    if (!data.user) {

      throw new Error(
        "Account was not created."
      );

    }


    const {
      error: profileError
    } = await sb
      .from("admins")
      .insert({

        user_id:
          data.user.id,

        name,

        role:
          "Administrator",

        bio:
          "BDH Admin"

      });


    if (profileError)
      throw profileError;


    alert(
      "Admin account created successfully."
    );


    closeModal();


    if (data.session) {

      session =
        data.session;

      isAdmin = true;

      adminPanel();

    }

    else {

      loginView();

    }


  } catch (error) {

    console.error(
      "Setup error:",
      error
    );


    alert(
      error.message ||
      "Admin setup failed."
    );

  }

}



/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadImage(file) {

  if (!session || !isAdmin)
    throw new Error(
      "You must be logged in as admin."
    );


  if (!file)
    return null;


  const ext =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";


  const path =
    `${crypto.randomUUID()}.${ext}`;


  const {
    error
  } = await sb.storage
    .from("bdh-assets")
    .upload(
      path,
      file,
      {
        upsert: false
      }
    );


  if (error)
    throw error;


  const {
    data
  } = sb.storage
    .from("bdh-assets")
    .getPublicUrl(path);


  return data.publicUrl;

}



/* =========================================================
   ADMIN PANEL
========================================================= */

async function adminPanel() {

  if (!session) {

    loginView();

    return;

  }


  isAdmin = true;


  openModal(`

    <div class="admin-view">

      <h2>
        BDH Admin Panel
      </h2>


      <div class="admin-tabs">

        <button
          onclick="websiteEditor()">

          Website

        </button>


        <button
          onclick="adminsEditor()">

          Admins

        </button>


        <button
          onclick="membersEditor()">

          Members

        </button>


        <button
          onclick="worksEditor()">

          Works

        </button>


        <button
          onclick="visitorPreview()">

          Preview

        </button>


        <button
          onclick="doLogout()">

          Logout

        </button>

      </div>


      <div id="adminContent">

        <p>
          Select an option above.
        </p>

      </div>

    </div>

  `);

}



/* =========================================================
   WEBSITE EDITOR
========================================================= */

function websiteEditor() {

  $("#adminContent").innerHTML = `

    <h3>
      Website Settings
    </h3>


    <label>
      Tagline
    </label>


    <textarea
      id="siteTagline"
      rows="4">${esc(
        site.tagline || ""
      )}</textarea>


    <label>
      Facebook Page
    </label>


    <input
      id="siteFacebook"
      type="url"
      value="${esc(
        site.facebook || ""
      )}">


    <label>
      Website Logo
    </label>


    <input
      id="siteLogoFile"
      type="file"
      accept="image/*">


    <button
      class="btn"
      onclick="saveWebsite()">

      Save Website

    </button>

  `;

}



/* =========================================================
   SAVE WEBSITE
========================================================= */

async function saveWebsite() {

  try {

    let logoUrl =
      site.logo_url ||
      fallback.logo_url;


    const file =
      $("#siteLogoFile").files[0];


    if (file) {

      logoUrl =
        await uploadImage(file);

    }


    const payload = {

      id: 1,

      tagline:
        $("#siteTagline").value.trim(),

      facebook:
        $("#siteFacebook").value.trim(),

      logo_url:
        logoUrl

    };


    const {
      error
    } = await sb
      .from("site_settings")
      .upsert(payload);


    if (error)
      throw error;


    await loadPublic();


    alert(
      "Website settings saved."
    );


    websiteEditor();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Could not save website settings."
    );

  }

}



/* =========================================================
   ADMINS EDITOR
========================================================= */

function adminsEditor() {

  const html =
    admins.length

      ? admins
          .map(
            (admin) => `

              <div class="admin-row">

                ${pic(
                  admin.photo_url,
                  admin.name
                )}

                <div>

                  <strong>
                    ${esc(admin.name)}
                  </strong>

                  <p>
                    ${esc(
                      admin.role || ""
                    )}
                  </p>

                </div>


                <button
                  onclick="editAdmin('${admin.id}')">

                  Edit

                </button>


                <button
                  onclick="deleteAdmin('${admin.id}')">

                  Delete

                </button>

              </div>

            `
          )
          .join("")

      : `<p>No admins found.</p>`;


  $("#adminContent").innerHTML = `

    <h3>
      Admin Team
    </h3>


    ${html}


    <hr>


    <h3>
      Add Admin
    </h3>


    ${adminEditFields()}


    <button
      class="btn"
      onclick="saveAdmin()">

      Add Admin

    </button>

  `;

}



/* =========================================================
   ADMIN EDIT FIELDS
========================================================= */

function adminEditFields(admin = {}) {

  return `

    <input
      id="adminName"
      placeholder="Name"
      value="${esc(
        admin.name || ""
      )}">


    <input
      id="adminRole"
      placeholder="Role"
      value="${esc(
        admin.role || ""
      )}">


    <textarea
      id="adminBio"
      placeholder="Bio"
      rows="4">${esc(
        admin.bio || ""
      )}</textarea>


    <input
      id="adminFacebook"
      type="url"
      placeholder="Facebook URL"
      value="${esc(
        admin.facebook || ""
      )}">


    <input
      id="adminInstagram"
      type="url"
      placeholder="Instagram URL"
      value="${esc(
        admin.instagram || ""
      )}">


    <input
      id="adminPhoto"
      type="file"
      accept="image/*">

  `;

}



/* =========================================================
   EDIT ADMIN
========================================================= */

function editAdmin(id) {

  const admin =
    admins.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!admin)
    return;


  $("#adminContent").innerHTML = `

    <h3>
      Edit Admin
    </h3>


    ${adminEditFields(admin)}


    <button
      class="btn"
      onclick="saveAdmin('${admin.id}')">

      Save Changes

    </button>

  `;

}



/* =========================================================
   SAVE ADMIN
========================================================= */

async function saveAdmin(id = null) {

  try {

    const existing =
      id
        ? admins.find(
            (item) =>
              String(item.id) ===
              String(id)
          )
        : null;


    let photoUrl =
      existing?.photo_url ||
      null;


    const file =
      $("#adminPhoto").files[0];


    if (file) {

      photoUrl =
        await uploadImage(file);

    }


    const payload = {

      name:
        $("#adminName").value.trim(),

      role:
        $("#adminRole").value.trim(),

      bio:
        $("#adminBio").value.trim(),

      facebook:
        $("#adminFacebook").value.trim(),

      instagram:
        $("#adminInstagram").value.trim(),

      photo_url:
        photoUrl

    };


    let result;


    if (id) {

      result =
        await sb
          .from("admins")
          .update(payload)
          .eq("id", id);

    }

    else {

      result =
        await sb
          .from("admins")
          .insert(payload);

    }


    if (result.error)
      throw result.error;


    await loadPublic();


    alert(
      "Admin saved successfully."
    );


    adminsEditor();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Could not save admin."
    );

  }

}



/* =========================================================
   DELETE ADMIN
========================================================= */

async function deleteAdmin(id) {

  if (
    !confirm(
      "Are you sure you want to delete this admin?"
    )
  )
    return;


  try {

    const {
      error
    } = await sb
      .from("admins")
      .delete()
      .eq("id", id);


    if (error)
      throw error;


    await loadPublic();


    adminsEditor();


  } catch (error) {

    alert(
      error.message ||
      "Could not delete admin."
    );

  }

}



/* =========================================================
   MEMBERS EDITOR
========================================================= */

function membersEditor() {

  const html =
    members.length

      ? members
          .map(
            (member) => `

              <div class="admin-row">

                ${pic(
                  member.photo_url,
                  member.name
                )}

                <div>

                  <strong>
                    ${esc(member.name)}
                  </strong>

                  <p>
                    ${esc(
                      member.role || ""
                    )}
                  </p>

                </div>


                <button
                  onclick="editMember('${member.id}')">

                  Edit

                </button>


                <button
                  onclick="deleteMember('${member.id}')">

                  Delete

                </button>

              </div>

            `
          )
          .join("")

      : `<p>No members found.</p>`;


  $("#adminContent").innerHTML = `

    <h3>
      Members
    </h3>


    ${html}


    <hr>


    <h3>
      Add Member
    </h3>


    ${memberEditFields()}


    <button
      class="btn"
      onclick="saveMember()">

      Add Member

    </button>

  `;

}



/* =========================================================
   MEMBER FIELDS
========================================================= */

function memberEditFields(member = {}) {

  let videos = [];


  if (Array.isArray(member.videos)) {

    videos =
      member.videos;

  }


  return `

    <input
      id="memberName"
      placeholder="Name"
      value="${esc(
        member.name || ""
      )}">


    <input
      id="memberRole"
      placeholder="Role"
      value="${esc(
        member.role || ""
      )}">


    <textarea
      id="memberBio"
      placeholder="Bio"
      rows="4">${esc(
        member.bio || ""
      )}</textarea>


    <input
      id="memberFacebook"
      type="url"
      placeholder="Facebook URL"
      value="${esc(
        member.facebook || ""
      )}">


    <input
      id="memberInstagram"
      type="url"
      placeholder="Instagram URL"
      value="${esc(
        member.instagram || ""
      )}">


    <label>
      Profile Photo
    </label>


    <input
      id="memberPhoto"
      type="file"
      accept="image/*">


    <label>
      Work Video URLs
      <br>
      <small>
        One URL per line
      </small>
    </label>


    <textarea
      id="memberVideos"
      rows="6"
      placeholder="https://...">${esc(
        videos.join("\n")
      )}</textarea>

  `;

}



/* =========================================================
   EDIT MEMBER
========================================================= */

function editMember(id) {

  const member =
    members.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!member)
    return;


  $("#adminContent").innerHTML = `

    <h3>
      Edit Member
    </h3>


    ${memberEditFields(member)}


    <button
      class="btn"
      onclick="saveMember('${member.id}')">

      Save Changes

    </button>

  `;

}



/* =========================================================
   SAVE MEMBER
========================================================= */

async function saveMember(id = null) {

  try {

    const existing =
      id
        ? members.find(
            (item) =>
              String(item.id) ===
              String(id)
          )
        : null;


    let photoUrl =
      existing?.photo_url ||
      null;


    const file =
      $("#memberPhoto").files[0];


    if (file) {

      photoUrl =
        await uploadImage(file);

    }


    const videos =
      $("#memberVideos")
        .value
        .split("\n")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean);


    const payload = {

      name:
        $("#memberName").value.trim(),

      role:
        $("#memberRole").value.trim(),

      bio:
        $("#memberBio").value.trim(),

      facebook:
        $("#memberFacebook").value.trim(),

      instagram:
        $("#memberInstagram").value.trim(),

      photo_url:
        photoUrl,

      videos

    };


    let result;


    if (id) {

      result =
        await sb
          .from("members")
          .update(payload)
          .eq("id", id);

    }

    else {

      result =
        await sb
          .from("members")
          .insert(payload);

    }


    if (result.error)
      throw result.error;


    await loadPublic();


    alert(
      "Member saved successfully."
    );


    membersEditor();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Could not save member."
    );

  }

}



/* =========================================================
   DELETE MEMBER
========================================================= */

async function deleteMember(id) {

  if (
    !confirm(
      "Are you sure you want to delete this member?"
    )
  )
    return;


  try {

    const {
      error
    } = await sb
      .from("members")
      .delete()
      .eq("id", id);


    if (error)
      throw error;


    await loadPublic();


    membersEditor();


  } catch (error) {

    alert(
      error.message ||
      "Could not delete member."
    );

  }

}



/* =========================================================
   WORKS EDITOR
========================================================= */

function worksEditor() {

  const html =
    works.length

      ? works
          .map(
            (work) => `

              <div class="admin-row">

                <div>

                  <strong>
                    ${esc(work.title)}
                  </strong>

                  <p>
                    ${esc(
                      work.type || ""
                    )}
                  </p>

                </div>


                <button
                  onclick="editWork('${work.id}')">

                  Edit

                </button>


                <button
                  onclick="deleteWork('${work.id}')">

                  Delete

                </button>

              </div>

            `
          )
          .join("")

      : `<p>No works found.</p>`;


  $("#adminContent").innerHTML = `

    <h3>
      Works
    </h3>


    ${html}


    <hr>


    <h3>
      Add Work
    </h3>


    ${workEditFields()}


    <button
      class="btn"
      onclick="saveWork()">

      Add Work

    </button>

  `;

}



/* =========================================================
   WORK FIELDS
========================================================= */

function workEditFields(work = {}) {

  return `

    <input
      id="workTitle"
      placeholder="Work Title"
      value="${esc(
        work.title || ""
      )}">


    <input
      id="workType"
      placeholder="Type / Category"
      value="${esc(
        work.type || ""
      )}">


    <input
      id="workUrl"
      type="url"
      placeholder="Video / Project URL"
      value="${esc(
        work.url || ""
      )}">

  `;

}



/* =========================================================
   EDIT WORK
========================================================= */

function editWork(id) {

  const work =
    works.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!work)
    return;


  $("#adminContent").innerHTML = `

    <h3>
      Edit Work
    </h3>


    ${workEditFields(work)}


    <button
      class="btn"
      onclick="saveWork('${work.id}')">

      Save Changes

    </button>

  `;

}



/* =========================================================
   SAVE WORK
========================================================= */

async function saveWork(id = null) {

  try {

    const payload = {

      title:
        $("#workTitle").value.trim(),

      type:
        $("#workType").value.trim(),

      url:
        $("#workUrl").value.trim()

    };


    let result;


    if (id) {

      result =
        await sb
          .from("works")
          .update(payload)
          .eq("id", id);

    }

    else {

      result =
        await sb
          .from("works")
          .insert(payload);

    }


    if (result.error)
      throw result.error;


    await loadPublic();


    alert(
      "Work saved successfully."
    );


    worksEditor();


  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Could not save work."
    );

  }

}



/* =========================================================
   DELETE WORK
========================================================= */

async function deleteWork(id) {

  if (
    !confirm(
      "Are you sure you want to delete this work?"
    )
  )
    return;


  try {

    const {
      error
    } = await sb
      .from("works")
      .delete()
      .eq("id", id);


    if (error)
      throw error;


    await loadPublic();


    worksEditor();


  } catch (error) {

    alert(
      error.message ||
      "Could not delete work."
    );

  }

}



/* =========================================================
   VISITOR PREVIEW
========================================================= */

function visitorPreview() {

  closeModal();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}



/* =========================================================
   LOGOUT
========================================================= */

async function doLogout() {

  try {

    await sb.auth.signOut();

    session = null;

    isAdmin = false;

    closeModal();

    await loadPublic();


  } catch (error) {

    alert(
      error.message ||
      "Logout failed."
    );

  }

}



/* =========================================================
   MODAL EVENTS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const close =
      $("#closeModal");

    const modal =
      $("#modal");


    if (close) {

      close.onclick =
        closeModal;

    }


    if (modal) {

      modal.addEventListener(
        "click",
        (event) => {

          if (
            event.target === modal
          ) {

            closeModal();

          }

        }
      );

    }


    document.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key === "Escape"
        ) {

          closeModal();

        }

      }
    );

  }
);



/* =========================================================
   BOOT
========================================================= */

async function boot() {

  const year =
    $("#year");


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  const adminButton =
    $("#adminBtn");


  if (adminButton) {

    adminButton.onclick =
      openAdmin;

  }


  const facebookButton =
    $("#fbContact");


  if (facebookButton) {

    facebookButton.href =
      fallback.facebook;

    facebookButton.target =
      "_blank";

    facebookButton.rel =
      "noopener noreferrer";

  }


  if (!SUPABASE_READY) {

    render();

    return;

  }


  try {

    const {
      data
    } = await sb.auth.getSession();


    session =
      data.session;


    isAdmin =
      !!session;


    sb.auth.onAuthStateChange(
      (_event, newSession) => {

        session =
          newSession;

        isAdmin =
          !!newSession;

      }
    );


    await loadPublic();


  } catch (error) {

    console.error(
      "Boot error:",
      error
    );

    render();

  }

}


boot();
