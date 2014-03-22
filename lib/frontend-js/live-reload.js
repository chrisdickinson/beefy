function liveReloadCode(lastUpdate, updateRate) {
  setTimeout(iter, updateRate)

  function iter() {
    var xhr = new XMLHttpRequest()

    xhr.open('GET', '/-/live-reload')
    xhr.onreadystatechange = function() {
      if(xhr.readyState !== 4) {
        return
      }

      try {
        var change = JSON.parse(xhr.responseText).lastUpdate

        if(lastUpdate < change) {
          window.location.reload()

          return
        }
      } catch(err) {
      }

      xhr =
      xhr.onreadystatechange = null
      setTimeout(iter, updateRate)
    }

    xhr.send(null)
  }
}

