//
//  FBDemoRouter.h
//  tios
//
//  Created by 兴往 on 2019/9/11.
//  Copyright © 2019 闲鱼. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <flutter_boost/FLBPlatform.h>

NS_ASSUME_NONNULL_BEGIN

@interface FBDemoRouter : NSObject<FLBPlatform>

@property (nonatomic,strong) UINavigationController *navigationController;

+ (void)registerInFlutterBoost;

+ (FBDemoRouter *)shared;

- (void)addEntryView:(UIViewController *)vc;

@end

NS_ASSUME_NONNULL_END
