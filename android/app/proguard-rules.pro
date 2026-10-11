# Add project specific ProGuard rules here.
# Keep NanoHTTPD classes
-keep class fi.iki.elonen.** { *; }

# Keep ZXing classes
-keep class com.journeyapps.barcodescanner.** { *; }
-keep class com.google.zxing.** { *; }

# Keep Model classes for Gson
-keep class com.church.timer.offline.model.** { *; }
