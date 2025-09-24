$(document).on("click", "#accordion>li>a", function () {
    $(this).siblings(".box").addClass("active");
    $(this).closest("li").siblings("li").find(".box").removeClass("active");
});

$("#accordion").on("click", "li>a", function () {
    $("#accordion li a.active").removeClass("active");
    $(this).addClass("active");
});
