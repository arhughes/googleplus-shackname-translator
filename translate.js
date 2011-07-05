function getNames(callback)
{
    chrome.extension.sendRequest({"name": "getNames"}, function(response)
    {
        callback(response);
    });
}

function getName(oid, link, callback)
{
    chrome.extension.sendRequest({"name": "getName", "oid": oid}, function(response)
    {
        callback(link, response);
    });
}

function mapNames(map, source)
{
    var links = source.getElementsByTagName("a");

    // look for all the links with an 'oid' attribute
    for (var i = 0; i < links.length; i++)
    {
        var oid = links[i].getAttribute("oid");

        // don't put names after images
        if (oid && links[i].firstChild.tagName != "IMG")
        {
            // match the oid number with our mapping
            var name = map[oid];
            if (name != null)
            {
                links[i].innerHTML += " (" + name + ")";
            }
            else
            {
                getName(oid, links[i], function(link, name)
                {
                    console.log("got here! from " + name);
                    if (name)
                        link.innerHTML += " (" + name + ")";
                });
            }
        }
    }
}

getNames(function (response)
{
    var map = JSON.parse(response);


    // map all the links alread in the document
    mapNames(map, document);

    document.addEventListener('DOMNodeInserted', function(e)
    {
        // try to map all the links that just got added
        mapNames(map, e.srcElement);
    });

});
