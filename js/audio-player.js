(function () {
  "use strict";

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function parseTimeToSeconds(timeStr) {
    var parts = timeStr.trim().split(":").map(function (p) {
      return parseInt(p, 10);
    });
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function parseTimelineLine(line) {
    line = line.trim();
    if (!line || /^TIMINGS$/i.test(line)) return null;

    var rangeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (!rangeMatch) return { label: line };

    var start = rangeMatch[1];
    var end = rangeMatch[2];
    var idx = rangeMatch.index;
    var before = line.slice(0, idx).trim();
    var after = line.slice(idx + rangeMatch[0].length).trim();

    if (idx === 0) {
      return {
        start: start,
        end: end,
        label: after.replace(/^[—–-]\s*/, "").trim() || line,
      };
    }

    return {
      start: start,
      end: end,
      label: before.replace(/:\s*$/, "").trim() || line,
    };
  }

  function makeTimelineSeekButton(timeStr) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vch-timeline__stamp";
    btn.textContent = timeStr;
    btn.setAttribute("data-seek", String(parseTimeToSeconds(timeStr)));
    btn.setAttribute("aria-label", "Seek to " + timeStr);
    return btn;
  }

  function buildTimelinePanel(text) {
    var list = document.createElement("ul");
    list.className = "vch-timeline";
    list.setAttribute("role", "list");

    text.split(/\r?\n/).forEach(function (line) {
      var parsed = parseTimelineLine(line);
      if (!parsed) return;

      var item = document.createElement("li");
      item.className = "vch-timeline__item";

      var node = document.createElement("span");
      node.className = "vch-timeline__node";
      node.setAttribute("aria-hidden", "true");
      item.appendChild(node);

      var card = document.createElement("article");
      card.className = "vch-timeline__card";

      if (parsed.start && parsed.end) {
        item.setAttribute("data-range-start", String(parseTimeToSeconds(parsed.start)));
        item.setAttribute("data-range-end", String(parseTimeToSeconds(parsed.end)));

        var times = document.createElement("div");
        times.className = "vch-timeline__times";
        times.appendChild(makeTimelineSeekButton(parsed.start));
        var dash = document.createElement("span");
        dash.className = "vch-timeline__arrow";
        dash.setAttribute("aria-hidden", "true");
        dash.textContent = "→";
        times.appendChild(dash);
        times.appendChild(makeTimelineSeekButton(parsed.end));
        card.appendChild(times);

        var copy = document.createElement("p");
        copy.className = "vch-timeline__copy";
        copy.textContent = parsed.label;
        card.appendChild(copy);
      } else {
        item.classList.add("vch-timeline__item--plain");
        var copyOnly = document.createElement("p");
        copyOnly.className = "vch-timeline__copy";
        copyOnly.textContent = parsed.label;
        card.appendChild(copyOnly);
      }

      item.appendChild(card);
      list.appendChild(item);
    });

    return list;
  }

  function initVchAudioPlayer(root) {
    var audio = root.querySelector(".vch-player__audio");
    var playBtn = root.querySelector(".vch-player__play-btn");
    var progressBtn = root.querySelector(".vch-player__seek");
    var seekFill = root.querySelector(".vch-player__seek-fill");
    var seekThumb = root.querySelector(".vch-player__seek-thumb");
    var seekHover = root.querySelector(".vch-player__seek-hover");
    var timeCur = root.querySelector(".vch-player__time-cur");
    var timeDur = root.querySelector(".vch-player__time-dur");
    var titleEl = root.querySelector(".vch-player__title");
    var artistEl = root.querySelector(".vch-player__artist");
    var trackDescEl = root.querySelector(".vch-player__track-desc");
    var timelinesSlot = root.querySelector(".vch-player__timelines-slot");
    var timelinesToggle = root.querySelector(".vch-player__timelines-toggle");
    var timelinesPanel = root.querySelector(".vch-player__timelines-panel");
    var timelinesViewport = root.querySelector(".vch-player__timelines-viewport");
    var tracks = [].slice.call(root.querySelectorAll(".vch-player__track"));
    if (!audio || !playBtn || !tracks.length || !progressBtn || !seekFill) return;

    var artist = root.getAttribute("data-artist") || "";
    var playlist = root.getAttribute("data-playlist") || "";
    var activeIndex = 0;
    var displayRatio = 0;
    var progressRaf = null;
    var progressSmooth = 0.14;

    if (artistEl) artistEl.textContent = artist;
    if (titleEl && playlist) titleEl.textContent = playlist;

    function isTimelinesOpen() {
      return timelinesSlot && timelinesSlot.classList.contains("is-expanded");
    }

    function openTimelines() {
      if (!timelinesSlot || !timelinesToggle) return;
      timelinesSlot.classList.add("is-expanded");
      timelinesToggle.setAttribute("aria-expanded", "true");
      if (timelinesPanel) timelinesPanel.setAttribute("aria-hidden", "false");
    }

    function closeTimelines() {
      if (!timelinesSlot || !timelinesToggle) return;
      timelinesSlot.classList.remove("is-expanded");
      timelinesToggle.setAttribute("aria-expanded", "false");
      if (timelinesPanel) timelinesPanel.setAttribute("aria-hidden", "true");
    }

    function updateTimelineHighlight() {
      if (!timelinesViewport || !audio.duration) return;
      var items = timelinesViewport.querySelectorAll(".vch-timeline__item[data-range-start]");
      var t = audio.currentTime;
      items.forEach(function (item) {
        var start = parseFloat(item.getAttribute("data-range-start"), 10);
        var end = parseFloat(item.getAttribute("data-range-end"), 10);
        item.classList.toggle("is-current", t >= start && t < end);
      });
    }

    function updateTrackDetail(track) {
      if (!trackDescEl && !timelinesToggle && !timelinesViewport) return;

      var label = track.getAttribute("data-track-label");
      var trackTitle = track.querySelector(".vch-player__track-title");
      if (titleEl) {
        titleEl.textContent = label || (trackTitle && trackTitle.textContent) || playlist;
      }

      var desc = track.getAttribute("data-track-desc") || "";
      if (trackDescEl) {
        trackDescEl.textContent = desc;
        trackDescEl.hidden = !desc;
      }

      var timelineSource = track.parentElement && track.parentElement.querySelector(".vch-player__track-timeline-source");
      var timelineText = timelineSource ? timelineSource.textContent.trim() : "";

      if (timelinesToggle && timelinesViewport) {
        timelinesViewport.innerHTML = "";
        if (timelineText) {
          timelinesViewport.appendChild(buildTimelinePanel(timelineText));
          timelinesToggle.hidden = false;
          openTimelines();
        } else {
          timelinesToggle.hidden = true;
          closeTimelines();
        }
        updateTimelineHighlight();
      }
    }

    function setActive(index) {
      if (index < 0 || index >= tracks.length) return;
      activeIndex = index;
      tracks.forEach(function (btn, i) {
        btn.classList.toggle("is-active", i === index);
        btn.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      var track = tracks[index];
      updateTrackDetail(track);
      updateProgress(0, true);
      if (timeDur) timeDur.textContent = track.getAttribute("data-duration-label") || "0:00";
    }

    function applyProgressVisual(ratio) {
      ratio = Math.max(0, Math.min(1, ratio));
      var pct = ratio * 100 + "%";
      seekFill.style.width = pct;
      if (seekThumb) seekThumb.style.left = pct;
    }

    function updateProgress(ratio, instant) {
      ratio = Math.max(0, Math.min(1, ratio));
      if (instant) {
        displayRatio = ratio;
        applyProgressVisual(displayRatio);
      }
      if (timeCur && audio.duration) timeCur.textContent = formatTime(audio.currentTime);
      else if (timeCur) timeCur.textContent = "0:00";
    }

    function stopProgressLoop() {
      if (progressRaf) {
        cancelAnimationFrame(progressRaf);
        progressRaf = null;
      }
    }

    function progressLoop() {
      if (!audio.duration) {
        stopProgressLoop();
        return;
      }
      var target = audio.currentTime / audio.duration;
      displayRatio += (target - displayRatio) * progressSmooth;
      if (Math.abs(target - displayRatio) < 0.0004) displayRatio = target;
      applyProgressVisual(displayRatio);
      if (timeCur) timeCur.textContent = formatTime(audio.currentTime);
      updateTimelineHighlight();
      if (!audio.paused) progressRaf = requestAnimationFrame(progressLoop);
      else progressRaf = null;
    }

    function startProgressLoop() {
      stopProgressLoop();
      progressRaf = requestAnimationFrame(progressLoop);
    }

    function loadTrack(index, autoplay) {
      var track = tracks[index];
      if (!track) return;
      var src = track.getAttribute("data-audio-src");
      setActive(index);
      root.classList.remove("is-pending");
      audio.pause();
      root.classList.remove("is-playing");
      if (!src) {
        audio.removeAttribute("src");
        audio.load();
        playBtn.disabled = true;
        return;
      }
      if (audio.src !== new URL(src, window.location.href).href) {
        audio.src = src;
        audio.load();
      }
      playBtn.disabled = false;
      if (autoplay) {
        audio.play().catch(function () {
          root.classList.remove("is-playing");
        });
      }
    }

    function togglePlay() {
      var src = tracks[activeIndex] && tracks[activeIndex].getAttribute("data-audio-src");
      if (!src) return;
      if (audio.paused) {
        audio.play().catch(function () {
          root.classList.remove("is-playing");
        });
      } else {
        audio.pause();
      }
    }

    function seekFromEvent(e) {
      if (!audio.duration) return;
      var rect = progressBtn.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, x)) * audio.duration;
      updateProgress(audio.currentTime / audio.duration, true);
    }

    playBtn.addEventListener("click", togglePlay);
    progressBtn.addEventListener("click", seekFromEvent);

    progressBtn.addEventListener("mousemove", function (e) {
      if (!seekHover) return;
      var rect = progressBtn.getBoundingClientRect();
      if (!rect.width) return;
      var x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekHover.style.left = x * 100 + "%";
    });

    progressBtn.addEventListener("mouseleave", function () {
      if (seekHover) seekHover.style.left = "";
    });

    progressBtn.addEventListener("mousedown", function () {
      progressBtn.classList.add("is-dragging");
    });

    document.addEventListener("mouseup", function () {
      progressBtn.classList.remove("is-dragging");
    });

    if (timelinesToggle && timelinesViewport) {
      timelinesToggle.addEventListener("click", function () {
        if (isTimelinesOpen()) closeTimelines();
        else openTimelines();
      });

      timelinesViewport.addEventListener("click", function (e) {
        var seekBtn = e.target.closest(".vch-timeline__stamp");
        if (!seekBtn) return;
        e.preventDefault();
        e.stopPropagation();
        var sec = parseFloat(seekBtn.getAttribute("data-seek"), 10);
        if (!isFinite(sec)) return;
        var src = tracks[activeIndex] && tracks[activeIndex].getAttribute("data-audio-src");
        if (!src) return;
        function doSeek() {
          if (!audio.duration) return;
          audio.currentTime = Math.min(sec, audio.duration);
          updateProgress(audio.currentTime / audio.duration, true);
        }
        if (audio.duration) {
          doSeek();
        } else {
          audio.addEventListener("loadedmetadata", doSeek, { once: true });
        }
        if (audio.paused) {
          audio
            .play()
            .then(function () {
              startProgressLoop();
            })
            .catch(function () {
              root.classList.remove("is-playing");
            });
        }
      });
    }

    tracks.forEach(function (btn, index) {
      btn.setAttribute("role", "option");
      btn.addEventListener("click", function () {
        if (index === activeIndex && !audio.paused) {
          audio.pause();
          return;
        }
        loadTrack(index, true);
      });
    });

    audio.addEventListener("play", function () {
      root.classList.add("is-playing");
      startProgressLoop();
    });

    audio.addEventListener("pause", function () {
      root.classList.remove("is-playing");
      stopProgressLoop();
      if (audio.duration) updateProgress(audio.currentTime / audio.duration, true);
    });

    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      updateTimelineHighlight();
      var durEl = tracks[activeIndex] && tracks[activeIndex].querySelector(".vch-player__track-dur");
      if (durEl && !tracks[activeIndex].getAttribute("data-duration-label")) {
        durEl.textContent = formatTime(audio.duration);
      }
      if (timeDur && !tracks[activeIndex].getAttribute("data-duration-label")) {
        timeDur.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener("ended", function () {
      if (activeIndex < tracks.length - 1) {
        loadTrack(activeIndex + 1, true);
      } else {
        root.classList.remove("is-playing");
        stopProgressLoop();
        updateProgress(0, true);
      }
    });

    audio.addEventListener("loadedmetadata", function () {
      if (timeDur) timeDur.textContent = formatTime(audio.duration);
      var durEl = tracks[activeIndex] && tracks[activeIndex].querySelector(".vch-player__track-dur");
      if (durEl) durEl.textContent = formatTime(audio.duration);
      if (!audio.paused) startProgressLoop();
    });

    setActive(0);
    loadTrack(0, false);
  }

  function initVchAudioPlayers() {
    document.querySelectorAll("[data-vch-audio-player]").forEach(initVchAudioPlayer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVchAudioPlayers);
  } else {
    initVchAudioPlayers();
  }
})();
