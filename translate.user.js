// ==UserScript==
// @name Google+ Shackname Translator
// @description Adds shacknames to your Google+ stream
// @include https://plus.google.com/*
// ==/UserScript==

var NAMES_URL = "http://adam.hughes.cc/shacknames.json";
var CACHE_TIME = 60 * 60 * 1000;

function mapNames(map, source)
{
    var links = source.getElementsByTagName("a");

    // look for all the links with an 'oid' attribute
    for (var i = 0; i < links.length; i++)
    {
        var oid = links[i].getAttribute("oid");

        if (oid)
        {
            // match the oid number with our mapping
            var name = map[oid];
            if (name)
            {
                // don't put names after images
                if (links[i].firstChild.tagName != "IMG")
                {
                    links[i].innerHTML += " (" + name + ")";
                }
            }
        }
    }
}

function getItStartedInHere(map)
{
    // map all the links alread in the document
    mapNames(map, document);

    document.addEventListener('DOMNodeInserted', function(e)
    {
        // try to map all the links that just got added
        mapNames(map, e.target);
    }, false);
}

var cached = JSON.parse(GM_getValue('names', '{ }'));
var now = new Date().getTime();
if ((now - GM_getValue('last_updated', 0)) > CACHE_TIME)
{
    GM_log("fetching");
    GM_xmlhttpRequest({
        method: "GET",
        url: "http://adam.hughes.cc/shacknames.json", 
        onload: function(response) {
            var map = JSON.parse(response.responseText);

            GM_setValue('names', response.responseText);
            GM_setValue('last_updated', String(now));

            getItStartedInHere(map);
        }
    });
}
else
{
    GM_log("using cached");
    getItStartedInHere(cached);
}




