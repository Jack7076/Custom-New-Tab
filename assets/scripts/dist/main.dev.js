"use strict";

navigator.serviceWorker.register("sw.js");
var fetch_posts = 50;
var image_ttl = 10; // Minutes for Image to Remain on Page and in Cache unless offline.

var search_query = "flair:Desktop"; // Search Query to be passed to Reddit API

var subreddit = "Animewallpaper"; // Subreddit to search

var sort_mode = "new"; // Sort Method new|hot|top|relevance

var globalCounter = null; // Counter Interval Function, set for global code access.

var countdownTime = null; // Set Countdown Time Globally

var requesting_image = false;
$(document).ready(function () {
  // $("#app").css("background-image", "url(./test.jpg)");
  if (localStorage.getItem("imageFetchTime") == null) {
    // Initialise Image Timestamp
    localStorage.setItem("imageFetchTime", Date.parse("01/01/1970 00:00:00 UTC"));
  } else {
    // Data Already Exists, retrieve image from browser storage.
    var image = localStorage.getItem("image");
    $("#app").css("background-image", "url(".concat(image, ")")); // Update Countdown Timer.

    var image_update_time = new Date();
    image_update_time.setTime(localStorage.getItem("imageFetchTime"));
    image_update_time += image_ttl * 60 * 1000;
    updateCountdown(image_update_time);
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
      // Convert Minutes to ms, then compare to determine if the image should be updated.
      image_update_time += image_ttl * 60 * 1000;
      var current_time = Date.now();

      if (current_time > image_update_time) {
        requesting_image = true;
        $.ajax({
          // Connect to Reddit and Pass Search Parameters.
          url: "https://www.reddit.com/r/".concat(subreddit, "/search.json?q=").concat(search_query, "&limit=").concat(fetch_posts, "&sort=").concat(sort_mode, "&restrict_sr=1"),
          type: "GET",
          success: function success(data) {
            // Select a Random Post
            var selected_post = data.data.children[Math.floor(Math.random() * data.data.children.length)]; // Download Post's Image to a Blob and save it to browser local storage.

            saveImage(selected_post.data.url_overridden_by_dest);
          }
        });
      } else {
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
        } // Update Image


        $("#app").css("background-image", "url(".concat(URL.createObjectURL(data), ")")); // Update Time Image was Fetched

        localStorage.setItem("imageFetchTime", Date.now()); // Reset Web Request Flag

        requesting_image = false;
      };
    }
  });
};

var updateCountdown = function updateCountdown(update_time) {
  countdownTime = Date.parse(update_time);
};

globalCounter = setInterval(function () {
  // Get Current Time
  var now = new Date().getTime(); // Find the distance between now and the count down date

  var distance = countdownTime - now;
  var hours = Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
  var minutes = Math.floor(distance % (1000 * 60 * 60) / (1000 * 60));
  var seconds = Math.floor(distance % (1000 * 60) / 1000);

  if (distance < 0) {
    // If the count down is finished, remove text
    $(".countdown").text("");
  } else {
    // Output countdown timer
    $(".countdown").text("".concat(hours, "h ").concat(minutes, "m ").concat(seconds, "s"));
  }
}, 1000);