var NAMES_URL = "http://gamewith.us/_widgets/shack-google+.php";
var CHATTY_CIRCLE_URL = "https://plus.google.com/_/socialgraph/lookup/visible/?o=[null,null,\"117834331901534309691\"]";

// one hour
var CACHE_TIME = 60 * 60 * 1000;

var chatty_circle_regex = /"(\d{21})"/g

function getName(oid, callback)
{
    // if this person isn't friend's with the shack circle, they don't get a name
    var chatty_ids = JSON.parse(localStorage["chatty_ids"]);
    if (chatty_ids.indexOf("\"" + oid + "\"") < 0)
    {
        callback('');
        return;
    }

    var names = JSON.parse(localStorage["names"]);
    var name = names[oid];
    if (name == null)
    {
        getUrl('https://plus.google.com/' + oid + '/about', function(response)
        {
            var name_regex = new RegExp("Other names<\/h2><div class=\".*?\">(.*?)<\/div>", "i");
            var matches = name_regex.exec(response.responseText);
            if (matches != null)
            {
                var other_names = matches[1];
                console.log('Found other names for ' + oid + ': ' + other_names);

                // ignore some default entries
                if (other_names.indexOf('For example: maiden name') != -1)
                      other_names = '';

                // cache this name so we don't have to retrieve it again
                addToCache(oid, other_names);

                callback(other_names);
            }
            else
            {
                console.log('no other names found, caching empty');
                // cache this name so we don't have to retrieve it again
                addToCache(oid, '');
                names[oid] = '';

                callback('');
            }

        });
    }
    else
    {
        callback(name);
    }

}

function addToCache(oid, other_names)
{
    var names = JSON.parse(localStorage['names']);
    names[oid] = other_names;
    localStorage['names'] = JSON.stringify(names);
}

function getNames(callback)
{
    // this could probably be improved more by using if-modified-since header when calling getUrl
    var names = localStorage["names"];
    var last_updated = localStorage["last_update"];
    var chatty_ids = localStorage["chatty_ids"];
    var now = (new Date()).getTime();
    if (!chatty_ids || !names || !last_updated || ((now - last_updated) > CACHE_TIME))
    {
        getUrl(CHATTY_CIRCLE_URL, function(response)
        {
            var chatty_ids = response.responseText.match(chatty_circle_regex);
            localStorage["chatty_ids"] = JSON.stringify(chatty_ids);

            // not in cache, re-fetch
            getUrl(NAMES_URL, function (response)
            {
                names = JSON.parse(response.responseText);
                last_updated = now;
                localStorage["names"] = JSON.stringify(names);
                localStorage["last_update"] = last_updated;
                callback({ "names": names, "chatty_ids": chatty_ids });
            });
        });

    }
    else
    {
        // use cached
        callback({ "names": JSON.parse(names), "chatty_ids": JSON.parse(chatty_ids) });
    }
}

function getUrl(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState == 4)
        {
            callback(xhr);
        }
    }
    xhr.open("GET", url, true);
    xhr.send();
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
{
    if (request.name == "getNames")
        getNames(sendResponse);
    else if (request.name == "getName")
        getName(request.oid, sendResponse);
    else
        sendResponse();
});
