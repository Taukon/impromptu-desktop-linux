#include <napi.h>

#include <iostream>
#include <stdlib.h>

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/XKBlib.h>
#include <X11/keysym.h>
#include <X11/extensions/XTest.h> //sudo apt-get install libxtst-dev
#include <xcb/xcb.h>


Napi::Value keyEvent(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    //Display *display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    Display *display = XOpenDisplay(display_name);

    if(display){
        KeySym keySym = info[1].As<Napi::Number>().Int64Value();
        bool down = info[2].As<Napi::Boolean>().Value();

        KeyCode keyCode = XKeysymToKeycode(display, keySym);
        //  printf("keySym: %x code: %x down: %x\n", keySym, keyCode, down);
        if (keyCode != 0)
        {
            //printf("key: %d \n", down);
            XTestFakeKeyEvent(display, keyCode, down, 0L);
        }

        XCloseDisplay(display);
        //display = NULL;
    }

    return env.Null();
}

// TODO use Linux Input Subsystem
Napi::Value keyEventXID(const Napi::CallbackInfo &info)
{
   Napi::Env env = info.Env();

    //Display *display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    Display *display = XOpenDisplay(display_name);

    if(display){
        KeySym keySym = info[1].As<Napi::Number>().Int64Value();
        bool down = info[2].As<Napi::Boolean>().Value();

        KeyCode keyCode = XKeysymToKeycode(display, keySym);
        //  printf("keySym: %x code: %x down: %x\n", keySym, keyCode, down);
        if (keyCode != 0)
        {
            //printf("key: %d \n", down);
            XTestFakeKeyEvent(display, keyCode, down, 0L);
        }

        XCloseDisplay(display);
        //display = NULL;
    }

    return env.Null();
}

Napi::Value motionEvent(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    //Display *display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    Display *display = XOpenDisplay(display_name);

    if (display)
    {
        int x = info[1].As<Napi::Number>().Int32Value();
        int y = info[2].As<Napi::Number>().Int32Value();

        XTestFakeMotionEvent(display, -1, x, y, 0L);

        XCloseDisplay(display);
        //display = NULL;
    }

    return env.Null();
}

Napi::Value motionEventXID(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    //Display *display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    int x = info[1].As<Napi::Number>().Int32Value();
    int y = info[2].As<Napi::Number>().Int32Value();
    xcb_window_t window = info[3].As<Napi::Number>().Int32Value();

    xcb_connection_t *connection;
    xcb_query_tree_cookie_t tree_cookie;
    xcb_query_tree_reply_t *tree_reply;
    xcb_get_geometry_cookie_t geometry_cookie;
    xcb_get_geometry_reply_t *geometry;
    xcb_get_geometry_cookie_t parent_geometry_cookie;
    xcb_get_geometry_reply_t *parent_geometry;

    connection = xcb_connect(display_name, NULL);
    if(!connection)
    {
        return env.Null();
    }

    geometry_cookie = xcb_get_geometry(connection, window);
    geometry = xcb_get_geometry_reply(connection, geometry_cookie, NULL);
    if (!geometry) {
        // printf("Error: Failed to get window geometry\n");
        xcb_disconnect(connection);
        return env.Null();
    }

    tree_cookie = xcb_query_tree(connection, window);
    tree_reply = xcb_query_tree_reply(connection, tree_cookie, NULL);
    if(!tree_reply){
        // printf("Error: Failed to get window tree information\n");
        free(geometry);
        xcb_disconnect(connection);
        return env.Null();
    }
    parent_geometry_cookie = xcb_get_geometry(connection, tree_reply->parent);
    parent_geometry = xcb_get_geometry_reply(connection, parent_geometry_cookie, NULL);
    if (!parent_geometry) {
        // printf("Error: Failed to get window parent geometry\n");
        free(geometry);
        free(tree_reply);
        xcb_disconnect(connection);
        return env.Null();
    }

    // printf("X: %d\n", geometry->x);
    // printf("Y: %d\n", geometry->y);
    // printf("PX: %d\n", parent_geometry->x);
    // printf("PY: %d\n", parent_geometry->y);
    int base_x = parent_geometry->x + geometry->x;
    int base_y = parent_geometry->y + geometry->y;
    
    free(geometry);
    free(tree_reply);
    free(parent_geometry);
    xcb_disconnect(connection);

    Display *display = XOpenDisplay(display_name);
    if (display)
    {
        XTestFakeMotionEvent(display, -1, base_x + x, base_y + y, 0L);
        XCloseDisplay(display);
    }

    return env.Null();
}

Napi::Value buttonEvent(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    //Display *display = XOpenDisplay(NULL);
    std::string arg_str = info[0].As<Napi::String>();
    const char* display_name = arg_str.c_str();
    Display *display = XOpenDisplay(display_name);

    if (display)
    {
        int buttonMask = info[1].As<Napi::Number>().Int32Value();
        bool down = info[2].As<Napi::Boolean>().Value();
    
        if (buttonMask == 0x10)
        {
            //printf("scroll down ");
            //  buttonMask: 0x10 -> 0x5
            buttonMask = 0x5;
            XTestFakeButtonEvent(display, buttonMask, 1, 0L);
            XTestFakeButtonEvent(display, buttonMask, 0, 0L);
        }
        else if (buttonMask == 0x8)
        {
            //printf("scroll up ");
            //  buttonMask: 0x8 -> 0x4
            buttonMask = 0x4;
            XTestFakeButtonEvent(display, buttonMask, 1, 0L);
            XTestFakeButtonEvent(display, buttonMask, 0, 0L);
        }
        else {

            if (buttonMask == 0x4)
            {
                //printf("right click ");
                //  buttonMask: 0x4 -> 0x2 0x3 ?
                buttonMask = 0x3;
            }
            /*else if (buttonMask == 0x2)
            {
                // printf("wheel click ");
                //  buttonMask: 0x2 -> ?
                //  buttonMask = 0xa;
            }*/

            if (buttonMask != 0)
            {
                XTestFakeButtonEvent(display, buttonMask, down, 0L);
                //printf("buttonMask: 0x%x\n", buttonMask);
            }
        }

        XCloseDisplay(display);
        //display = NULL;
    }

    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "keyEvent"),
                Napi::Function::New(env, keyEvent));
    exports.Set(Napi::String::New(env, "keyEventXID"),
                Napi::Function::New(env, keyEventXID));
    exports.Set(Napi::String::New(env, "motionEvent"),
                Napi::Function::New(env, motionEvent));
    exports.Set(Napi::String::New(env, "motionEventXID"),
                Napi::Function::New(env, motionEventXID));
    exports.Set(Napi::String::New(env, "buttonEvent"),
                Napi::Function::New(env, buttonEvent));
    return exports;
}

NODE_API_MODULE(xtest, Init);