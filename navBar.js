var navBar = `
    <nav class="navbar navbar-dark bg-dark">
    <div class="container-fluid">
    <a class="navbar-brand"><img src='./assets/citrus logo.png' width='64px' height='64px'></a>
    <form class="d-flex">
        <span class="me-3" id="homeIconOuter"><i class="fa-solid fa-house fa-2x" id="homeIcon"></i></span>
        <span id="settingsIconOuter"><i class="fa-solid fa-gear fa-2x" id="settingsIcon"></i></span>
    </form>
    </div>
    </nav>
`
$(document).ready(function(){
    $('body').prepend(navBar)

    var currentPage = window.location.href.split('/');
    currentPage = currentPage[currentPage.length - 1];
    $('#homeIconOuter').click(function(){
        if (currentPage != "index.html") {
            window.location.href = "index.html";
        }
    })
    $('#settingsIconOuter').click(function(){
        if (currentPage != "settings.html") {
            window.location.href = "settings.html";
        }
    })
})