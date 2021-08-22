"use strict";

navigator.serviceWorker.register("sw.js");
var fetch_posts = 50;
var image_ttl = 30; // Minutes for Image to Remain on Page and in Cache unless offline.

var search_query = "flair:Desktop"; // Search Query to be passed to Reddit API

var subreddit = "Animewallpaper"; // Subreddit to search

var sort_mode = "new"; // Sort Method new|hot|top|relevance

var requesting_image = false;
$(document).ready(function () {
  // $("#app").css("background-image", "url(./test.jpg)");
  if (localStorage.getItem("imageFetchTime") == null) {
    // Initialise Image Timestamp
    localStorage.setItem("imageFetchTime", Date.parse("01/01/1970 00:00:00 UTC"));
  } else {
    // Data Already Exists, retrieve image from browser storage.
    var image = localStorage.getItem("image");
    $("#app").css("background-image", "url(".concat(image, ")")); // Set Link to Post

    $(".post_reference a").text(localStorage.getItem("imagePostURI"));
    $(".post_reference a").attr("href", localStorage.getItem("imagePostURI"));
  } // Run a task to check update the image on a rolling cycle.


  setInterval(update_image, 1000); // Call Update Image Function instead of waiting.

  update_image();
});

var update_image = function update_image() {
  // Only attempt to update the image if the browser is online.
  if (navigator.onLine) {
    var image_update_time = new Date();
    image_update_time.setTime(localStorage.getItem("imageFetchTime"));
    image_update_time = Date.parse(image_update_time); // Check to make sure that we are not currently making a web request.

    if (!requesting_image) {
      requesting_image = true; // Convert Minutes to ms, then compare to determine if the image should be updated.

      image_update_time += image_ttl * 60 * 1000;
      var current_time = Date.now();

      if (current_time > image_update_time) {
        $.ajax({
          // Connect to Reddit and Pass Search Parameters.
          url: "https://www.reddit.com/r/".concat(subreddit, "/search.json?q=").concat(search_query, "&limit=").concat(fetch_posts, "&sort=").concat(sort_mode, "&restrict_sr=1"),
          type: "GET",
          success: function success(data) {
            // Select a Random Post
            var selected_post = data.data.children[Math.floor(Math.random() * data.data.children.length)]; // Save Selected Post URI to Local Storage.

            localStorage.setItem("imagePostURI", "https://reddit.com/".concat(selected_post.data.permalink)); // Download Post's Image to a Blob and save it to browser local storage.

            saveImage(selected_post.data.url_overridden_by_dest);
          }
        });
      } else {
        requesting_image = false;
        return "Image has not yet Expired.";
      }
    } else {
      return "Image Update in Progress.";
    }
  }
};

var saveImage = function saveImage(uri) {
  $.ajax({
    url: uri,
    type: "GET",
    cache: false,
    xhr: function xhr() {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      return xhr;
    },
    success: function success(data) {
      // Convert Blob data to base64 then save to browser storage.
      var r = new FileReader();
      r.readAsDataURL(data);

      r.onloadend = function () {
        try {
          localStorage.setItem("image", r.result);
        } catch (error) {
          // Unable to save image in browser storage.
          requesting_image = false;
          update_image();
          return;
        } // Update Image


        $("#app").css("background-image", "url(".concat(URL.createObjectURL(data), ")")); // Set Link to Post

        $(".post_reference a").text(localStorage.getItem("imagePostURI"));
        $(".post_reference a").attr("href", localStorage.getItem("imagePostURI")); // Update Time Image was Fetched

        localStorage.setItem("imageFetchTime", Date.now()); // Reset Web Request Flag

        requesting_image = false;
      };
    },
    error: function error() {
      requesting_image = false;
      update_image();
    }
  });
};

var forceImageUpdate = function forceImageUpdate() {
  localStorage.setItem("imageFetchTime", Date.parse("01/01/1970 00:00:00 UTC"));
};